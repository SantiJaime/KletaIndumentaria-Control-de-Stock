import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/appContext'
import { useToast } from '../context/toastContext'
import { Role } from '../types'
import { BrandBadge } from './BrandBadge'

const roleLabels: Record<Role, string> = {
  [Role.Admin]: 'Administrador',
  [Role.Vendedor]: 'Vendedor',
}

interface NavItem {
  to: string
  label: string
  icon: string
  /** Roles que pueden verlo; sin esto, cualquier usuario con sesión. */
  roles?: Role[]
}

const publicNavItems: NavItem[] = [
  {
    to: '/login',
    label: 'Iniciar sesión',
    icon: 'fa-right-to-bracket text-kleta-rose',
  },
]

const privateNavItems: NavItem[] = [
  {
    to: '/operaciones',
    label: 'Generar nueva operación',
    icon: 'fa-cart-flatbed text-kleta-rose',
  },
  {
    to: '/historial',
    label: 'Lista de operaciones realizadas',
    icon: 'fa-list-check text-kleta-sage',
    roles: [Role.Admin],
  },
  {
    to: '/inventario',
    label: 'Inventario de Productos',
    icon: 'fa-boxes-stacked text-kleta-rose',
  },
]

const navBase = 'flex w-full items-center space-x-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all'
const navActive = 'border border-kleta-pink/30 bg-kleta-blush text-kleta-plum shadow-sm'
const navIdle = 'border border-transparent text-gray-600 hover:bg-kleta-blush/50 hover:text-kleta-plum'

export function Sidebar() {
  const { user, isCheckingSession, logout } = useApp()
  const showToast = useToast()
  const navigate = useNavigate()

  // Mientras se verifica la sesión no se muestra "Iniciar sesión" para no parpadear.
  const navItems = isCheckingSession
    ? []
    : user
      ? privateNavItems.filter((item) => !item.roles || item.roles.includes(user.role))
      : publicNavItems

  const handleLogout = async () => {
    await logout()
    showToast('Sesión cerrada')
    navigate('/login', { replace: true })
  }

  return (
    <aside className="z-10 flex w-full flex-col justify-between md:sticky md:top-0 md:h-screen md:shrink-0 md:overflow-y-auto border-r border-kleta-pink/20 bg-white p-5 shadow-sm md:w-72">
      <div>
        <div className="mb-8 flex items-center gap-3 border-b border-kleta-pink/10 px-2 py-3 md:flex-col md:pb-5">
          <BrandBadge />
          <div className="md:text-center">
            <h1 className="font-serif text-2xl leading-none font-bold text-kleta-plum">Kleta</h1>
            <span className="text-xs font-semibold tracking-widest text-kleta-light-plum uppercase">Indumentaria</span>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${navBase} ${isActive ? navActive : navIdle}`}
            >
              <i className={`fa-solid text-base ${item.icon}`} />
              <span className="text-left font-semibold">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-6">
        {user && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-kleta-bg p-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-kleta-rose text-xs font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-xs">
                <p className="font-semibold text-kleta-plum">{user.username}</p>
                <p className="text-gray-400">{roleLabels[user.role]}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="text-gray-400 transition hover:text-red-500"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <i className="fa-solid fa-right-from-bracket" />
            </button>
          </div>
        )}
        <div className="text-center text-xs text-kleta-light-plum">
          <i className="fa-brands fa-instagram mr-1" /> @kleta_indumentaria
        </div>
      </div>
    </aside>
  )
}
