// Vida de los tokens, en segundos. Las cookies duran lo mismo (Express usa milisegundos: ver `auth.cookies.ts`).
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 24 * 60 * 60;

// Límite de intentos de inicio de sesión: se cuentan los de los últimos 15 minutos.
export const LOGIN_ATTEMPTS_WINDOW_SECONDS = 15 * 60;
/** Intentos seguidos permitidos para un mismo usuario desde una misma IP. */
export const MAX_LOGIN_ATTEMPTS_PER_USER = 5;
/** Intentos permitidos desde una misma IP, sumando todos los usuarios que probó. */
export const MAX_LOGIN_ATTEMPTS_PER_IP = 20;

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
