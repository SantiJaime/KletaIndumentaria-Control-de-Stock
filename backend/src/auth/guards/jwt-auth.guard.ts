import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ACCESS_COOKIE } from '../auth.constants.js';
import type {
  AccessTokenPayload,
  AuthenticatedRequest,
} from '../auth.types.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

/** Guard global: toda ruta exige un access token válido en la cookie, salvo las marcadas con `@Public()`. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly accessSecret: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = (request.cookies as Record<string, string> | undefined)?.[
      ACCESS_COOKIE
    ];
    if (!token) throw new UnauthorizedException('Iniciá sesión para continuar');

    try {
      (request as AuthenticatedRequest).user =
        await this.jwt.verifyAsync<AccessTokenPayload>(token, {
          secret: this.accessSecret,
        });
    } catch {
      throw new UnauthorizedException('La sesión expiró');
    }
    return true;
  }
}
