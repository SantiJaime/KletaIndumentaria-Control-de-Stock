import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { ProtectedRoute } from './layouts/ProtectedRoute'
import { HistoryPage } from './pages/HistoryPage'
import { InventoryPage } from './pages/InventoryPage'
import { LoginPage } from './pages/LoginPage'
import { OperationsPage } from './pages/operations/OperationsPage'
import { Role } from './types'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/operaciones" element={<OperationsPage />} />
          <Route path="/inventario" element={<InventoryPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={[Role.Admin]} />}>
          <Route path="/historial" element={<HistoryPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/operaciones" replace />} />
    </Routes>
  )
}

export default App
