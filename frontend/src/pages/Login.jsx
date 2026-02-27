import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const estilos = {
  contenedor: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a0a00 0%, #2d1810 50%, #1a0a00 100%)',
  },
  card: {
    background: '#1e0f08',
    border: '1px solid #4a2c1a',
    borderRadius: 16,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: 32,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 700,
    color: '#c9a96e',
    margin: 0,
    letterSpacing: 1,
  },
  subtitulo: {
    fontSize: 13,
    color: '#8b6a4a',
    margin: '6px 0 0',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  label: {
    display: 'block',
    fontSize: 12,
    color: '#8b6a4a',
    marginBottom: 6,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    background: '#2d1810',
    border: '1px solid #4a2c1a',
    borderRadius: 8,
    color: '#e8d5b7',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  grupo: {
    marginBottom: 20,
  },
  boton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #c9a96e, #8b5e3c)',
    border: 'none',
    borderRadius: 8,
    color: '#1a0a00',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
    letterSpacing: 1,
  },
  error: {
    background: '#3d1515',
    border: '1px solid #6b2525',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#f87171',
    fontSize: 13,
    marginBottom: 20,
  },
}

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await login(email, password)
    } catch (err) {
      setError('Email o contraseña incorrectos')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={estilos.contenedor}>
      <div style={estilos.card}>
        <div style={estilos.logo}>
          <h1 style={estilos.titulo}>DermaClinic</h1>
          <p style={estilos.subtitulo}>Sistema de Gestión</p>
        </div>

        {error && <div style={estilos.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={estilos.grupo}>
            <label style={estilos.label}>Email</label>
            <input
              style={estilos.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@clinica.com"
              required
              autoFocus
            />
          </div>
          <div style={estilos.grupo}>
            <label style={estilos.label}>Contraseña</label>
            <input
              style={estilos.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button style={estilos.boton} type="submit" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
