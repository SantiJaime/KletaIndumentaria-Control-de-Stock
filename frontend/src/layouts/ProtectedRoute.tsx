import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/appContext'
import type { Role } from '../types'

interface ProtectedRouteProps {
  /** Roles que pueden entrar; sin esto, cualquier usuario con sesión. */
  roles?: Role[]
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, isCheckingSession } = useApp()
  const location = useLocation()

  // Al recargar, espera a saber si hay sesión: si no, mandaría al login a quien sí la tiene.
  if (isCheckingSession) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        <i className="fa-solid fa-spinner fa-spin mr-2 text-kleta-rose" />
        Verificando sesión…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  // Con sesión pero sin el rol necesario: vuelve a la pantalla de inicio.
  if (roles && !roles.includes(user.role)) return <Navigate to="/operaciones" replace />
  return <Outlet />
}
