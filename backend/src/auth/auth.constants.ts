// Vida de los tokens, en segundos. Las cookies duran lo mismo (Express usa milisegundos: ver `auth.cookies.ts`).
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 24 * 60 * 60;

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
