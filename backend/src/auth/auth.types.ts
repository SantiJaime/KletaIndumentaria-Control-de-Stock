import type { Request } from 'express';
import type { Role } from '../generated/prisma/enums.js';

/** Contenido del access token. */
export interface AccessTokenPayload {
  sub: number;
  username: string;
  role: Role;
}

/** Contenido del refresh token: `sid` es el id de la sesión guardada en la DB. */
export interface RefreshTokenPayload {
  sub: number;
  sid: string;
}

/** Request ya autenticada por `JwtAuthGuard`. */
export type AuthenticatedRequest = Request & { user: AccessTokenPayload };
