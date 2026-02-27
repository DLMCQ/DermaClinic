import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NuevoPaciente from './pages/NuevoPaciente'
import EditarPaciente from './pages/EditarPaciente'
import DetallePaciente from './pages/DetallePaciente'

function RutaProtegida({ children }) {
  const { user, cargando } = useAuth()
  if (cargando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#110800', color: '#c9a96e', fontSize: 16 }}>
      Cargando...
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user, cargando } = useAuth()

  if (cargando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#110800', color: '#c9a96e', fontSize: 16 }}>
      Cargando...
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
      <Route path="/pacientes/nuevo" element={<RutaProtegida><NuevoPaciente /></RutaProtegida>} />
      <Route path="/pacientes/:id" element={<RutaProtegida><DetallePaciente /></RutaProtegida>} />
      <Route path="/pacientes/:id/editar" element={<RutaProtegida><EditarPaciente /></RutaProtegida>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
