import type { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import {
  ACCESS_COOKIE,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE,
  REFRESH_TOKEN_TTL_SECONDS,
} from './auth.constants.js';

type SameSite = 'lax' | 'strict' | 'none';

/**
 * Opciones comunes de las cookies de sesión. `path: '/'` es necesario: el proxy de Vite saca el
 * prefijo `/api`, así que una cookie con otro path no se enviaría. `clearCookie` tiene que usar las
 * mismas opciones con las que se creó la cookie, por eso salen de acá.
 */
function baseOptions(config: ConfigService): CookieOptions {
  const sameSite = config.get<SameSite>('COOKIE_SAMESITE', 'lax');
  const secure =
    config.get<string>('COOKIE_SECURE') !== undefined
      ? config.get<string>('COOKIE_SECURE') === 'true'
      : config.get<string>('NODE_ENV') === 'production';
  return {
    httpOnly: true,
    secure: secure || sameSite === 'none',
    sameSite,
    path: '/',
  };
}

export function setAccessCookie(
  res: Response,
  config: ConfigService,
  token: string,
) {
  res.cookie(ACCESS_COOKIE, token, {
    ...baseOptions(config),
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  });
}

export function setRefreshCookie(
  res: Response,
  config: ConfigService,
  token: string,
) {
  res.cookie(REFRESH_COOKIE, token, {
    ...baseOptions(config),
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookies(res: Response, config: ConfigService) {
  res.clearCookie(ACCESS_COOKIE, baseOptions(config));
  res.clearCookie(REFRESH_COOKIE, baseOptions(config));
}
