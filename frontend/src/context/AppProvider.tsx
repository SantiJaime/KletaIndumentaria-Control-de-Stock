import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../helpers/auth.queries'
import { setSessionExpiredHandler } from '../lib/api'
import { formatDateTime } from '../lib/format'
import type { ApiOperation, Operation, User } from '../types'
import { AppContext, type AppContextValue } from './appContext'

export function AppProvider({ children }: { children: ReactNode }) {
  // La sesión vive solo en cookies httpOnly: el navegador no guarda ningún dato de sesión en el front.
  const [user, setUser] = useState<User | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  // El historial todavía vive en memoria (falta GET /operations): datos de ejemplo + lo registrado en la sesión.
  const [operations, setOperations] = useState<Operation[]>([])

  // Al abrir o recargar la página se recupera la sesión desde las cookies (el interceptor renueva el access token si venció).
  useEffect(() => {
    let ignore = false
    authApi
      .getMe()
      .then((me) => {
        if (!ignore) setUser(me)
      })
      .catch(() => {
        if (!ignore) setUser(null)
      })
      .finally(() => {
        if (!ignore) setIsCheckingSession(false)
      })
    // Si más adelante la sesión no se puede renovar, se vuelve al login.
    setSessionExpiredHandler(() => setUser(null))
    return () => {
      ignore = true
      setSessionExpiredHandler(null)
    }
  }, [])

  const login = useCallback(async (credentials: { username: string; password: string }) => {
    setUser(await authApi.login(credentials))
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Aunque falle el pedido, en esta pantalla se cierra la sesión (las cookies vencen solas).
    }
    setUser(null)
  }, [])

  const addOperation = useCallback((operation: ApiOperation) => {
    setOperations((prev) => [
      {
        id: operation.id,
        date: formatDateTime(new Date(operation.createdAt)),
        productId: operation.productId,
        barcode: operation.barcode,
        name: operation.name,
        size: operation.size,
        color: operation.color,
        type: operation.type,
        quantity: operation.quantity,
        total: operation.total,
      },
      ...prev,
    ])
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      isCheckingSession,
      operations,
      login,
      logout,
      addOperation,
    }),
    [user, isCheckingSession, operations, login, logout, addOperation],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
