import { createContext, useContext } from 'react'
import type { User } from '../types'

export interface AppContextValue {
  /** Usuario con sesión iniciada (se recupera de las cookies con `getMe`); `null` si no hay. */
  user: User | null
  /** `true` mientras se consulta si hay una sesión al abrir la página. */
  isCheckingSession: boolean
  /** Inicia sesión; lanza el error de la API si las credenciales no son válidas. */
  login: (credentials: { username: string; password: string }) => Promise<void>
  logout: () => Promise<void>
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return ctx
}
