import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const C = {
  bg: '#110800',
  sidebar: '#1a0f07',
  borde: '#3a2010',
  dorado: '#c9a96e',
  doradoClaro: '#e8d5b7',
  texto: '#d4b896',
  textoMuted: '#7a5a3a',
  acento: '#8b5e3c',
}

export default function Layout({ children }) {
  const { perfil, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const enlaces = [
    { ruta: '/', icono: '◈', label: 'Pacientes' },
    ...(perfil?.rol === 'doctora' ? [{ ruta: '/usuarios', icono: '◉', label: 'Usuarios' }] : []),
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: C.sidebar,
        borderRight: `1px solid ${C.borde}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 20px 20px', borderBottom: `1px solid ${C.borde}` }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.dorado, letterSpacing: 1 }}>DermaClinic</div>
          <div style={{ fontSize: 10, color: C.textoMuted, letterSpacing: 2, textTransform: 'uppercase', marginTop: 3 }}>
            Sistema de Gestión
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {enlaces.map(({ ruta, icono, label }) => {
            const activo = location.pathname === ruta || (ruta !== '/' && location.pathname.startsWith(ruta))
            return (
              <Link
                key={ruta}
                to={ruta}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  color: activo ? C.dorado : C.texto,
                  background: activo ? 'rgba(201,169,110,0.1)' : 'transparent',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: activo ? 600 : 400,
                  marginBottom: 4,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 16 }}>{icono}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Usuario */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.borde}` }}>
          <div style={{ fontSize: 13, color: C.texto, marginBottom: 2 }}>{perfil?.nombre}</div>
          <div style={{ fontSize: 11, color: C.textoMuted, textTransform: 'capitalize', marginBottom: 12 }}>
            {perfil?.rol}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px',
              background: 'transparent',
              border: `1px solid ${C.borde}`,
              borderRadius: 6,
              color: C.textoMuted,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {children}
      </main>
    </div>
  )
}
