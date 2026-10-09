import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from './auth.constants.js';
import type { AccessTokenPayload, RefreshTokenPayload } from './auth.types.js';
import { UserResponseDto } from './dto/user-response.dto.js';

const BCRYPT_ROUNDS = 12;

const INVALID_CREDENTIALS = 'Usuario o contraseña incorrectos';

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  // Hash de relleno: si el usuario no existe se compara igual, para no revelar por el tiempo de respuesta qué usuarios existen.
  private readonly dummyHash = bcrypt.hashSync('relleno', BCRYPT_ROUNDS);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  hashPassword(password: string) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /** Verifica las credenciales y abre una sesión. Devuelve el usuario y los dos tokens. */
  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    const valid = await bcrypt.compare(
      password,
      user?.passwordHash ?? this.dummyHash,
    );
    if (!user || !valid) throw new UnauthorizedException(INVALID_CREDENTIALS);

    // Aprovecha para limpiar las sesiones vencidas de este usuario.
    await this.prisma.authSession.deleteMany({
      where: { userId: user.id, expiresAt: { lt: new Date() } },
    });
    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    });

    return {
      user: new UserResponseDto(user),
      accessToken: await this.signAccessToken(user),
      refreshToken: await this.jwt.signAsync(
        { sub: user.id, sid: session.id } satisfies RefreshTokenPayload,
        { secret: this.refreshSecret, expiresIn: REFRESH_TOKEN_TTL_SECONDS },
      ),
    };
  }

  /**
   * Con un refresh token válido (y su sesión vigente) emite un access token nuevo.
   * El refresh token no se renueva: los 24 h cuentan desde el inicio de sesión.
   */
  async refresh(refreshToken: string | undefined) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('La sesión expiró');
    }
    return {
      user: new UserResponseDto(session.user),
      accessToken: await this.signAccessToken(session.user),
    };
  }

  /** Cierra la sesión: el refresh token deja de servir aunque no haya vencido. */
  async logout(refreshToken: string | undefined) {
    try {
      const { sid } = await this.verifyRefreshToken(refreshToken);
      await this.prisma.authSession.deleteMany({ where: { id: sid } });
    } catch {
      // Sin token válido no hay sesión que cerrar; igual se limpian las cookies.
    }
  }

  /** Datos actuales del usuario autenticado (`GET /auth/me`). */
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('La sesión expiró');
    return new UserResponseDto(user);
  }

  private signAccessToken(user: {
    id: number;
    username: string;
    role: AccessTokenPayload['role'];
  }) {
    return this.jwt.signAsync(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
      } satisfies AccessTokenPayload,
      { secret: this.accessSecret, expiresIn: ACCESS_TOKEN_TTL_SECONDS },
    );
  }

  private async verifyRefreshToken(token: string | undefined) {
    if (!token) throw new UnauthorizedException('Iniciá sesión para continuar');
    try {
      return await this.jwt.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('La sesión expiró');
    }
  }
}
