import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { REFRESH_COOKIE } from './auth.constants.js';
import {
  clearAuthCookies,
  setAccessCookie,
  setRefreshCookie,
} from './auth.cookies.js';
import { AuthService } from './auth.service.js';
import type { AccessTokenPayload } from './auth.types.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { LoginDto } from './dto/login.dto.js';

const refreshTokenOf = (req: Request) =>
  (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() { username, password }: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.login(
      username,
      password,
    );
    setAccessCookie(res, this.config, accessToken);
    setRefreshCookie(res, this.config, refreshToken);
    return user;
  }

  // Pública porque se usa cuando el access token ya venció; valida el refresh token de la cookie.
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { user, accessToken } = await this.authService.refresh(
        refreshTokenOf(req),
      );
      setAccessCookie(res, this.config, accessToken);
      return user;
    } catch (error) {
      clearAuthCookies(res, this.config);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(refreshTokenOf(req));
    clearAuthCookies(res, this.config);
  }

  @Get('me')
  getMe(@CurrentUser() user: AccessTokenPayload) {
    return this.authService.getMe(user.sub);
  }
}
