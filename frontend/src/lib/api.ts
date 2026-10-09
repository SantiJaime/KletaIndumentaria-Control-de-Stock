import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios'

/**
 * Cliente HTTP del backend.
 *
 * - `baseURL`: por defecto `/api`, que en desarrollo Vite redirige al backend (ver `server.proxy` en
 *   vite.config.ts) y en producción se resuelve con un rewrite del hosting. Así el front y la API
 *   comparten dominio y las cookies de sesión son de primera parte. `VITE_API_URL` permite apuntar
 *   a otra URL (en ese caso el backend tiene que habilitar CORS con `credentials: true`).
 * - `withCredentials`: el navegador envía y guarda las cookies en cada request (autenticación).
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

/** Endpoints de autenticación: un 401 acá es un error normal (credenciales, sesión vencida), no se reintenta. */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout']

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

let onSessionExpired: (() => void) | null = null

/** Registra qué hacer cuando la sesión ya no se puede renovar (ej. cerrar la sesión en el estado de la app). */
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler
}

// Una sola renovación a la vez: si varias requests fallan juntas con 401, comparten la misma.
let refreshing: Promise<unknown> | null = null

function refreshSession() {
  refreshing ??= api.post('/auth/refresh').finally(() => {
    refreshing = null
  })
  return refreshing
}

/**
 * El access token dura 15 minutos. Si una request falla con 401, se renueva con el refresh token
 * (cookie, hasta 24 h) y se repite una vez. Si no se puede renovar, la sesión terminó.
 */
api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!isAxiosError(error) || error.response?.status !== 401 || !error.config) throw error

  const config: RetriableConfig = error.config
  if (config._retried || AUTH_ENDPOINTS.some((path) => config.url?.startsWith(path))) throw error

  config._retried = true
  try {
    await refreshSession()
  } catch {
    onSessionExpired?.()
    throw error
  }
  return api(config)
})

/** Forma de los errores de NestJS: `message` es un texto o una lista (errores de validación). */
interface ApiErrorBody {
  message?: string | string[]
}

/** Mensaje legible de un error de la API para mostrar en un toast o debajo de un formulario. */
export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (!isAxiosError<ApiErrorBody>(error)) return fallback
  if (!error.response) {
    return error.code === 'ECONNABORTED'
      ? 'El servidor tardó demasiado en responder'
      : 'No se pudo conectar con el servidor'
  }

  const { message } = error.response.data ?? {}
  if (Array.isArray(message)) return message[0] ?? fallback
  return message ?? fallback
}
