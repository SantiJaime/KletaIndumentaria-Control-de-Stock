import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'

/** Layout común a todas las páginas: la barra lateral adapta sus links según la sesión. */
export function AppLayout() {
  // El inventario tiene muchas columnas (más las acciones): necesita más ancho que el resto de las pantallas.
  const isWide = useLocation().pathname === '/inventario'

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-y-auto p-4 md:p-8">
        <div className={`mx-auto flex w-full flex-1 flex-col ${isWide ? 'max-w-7xl' : 'max-w-5xl'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
