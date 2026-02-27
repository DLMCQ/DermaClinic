import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const C = {
  dorado: '#c9a96e',
  doradoClaro: '#e8d5b7',
  texto: '#d4b896',
  textoMuted: '#7a5a3a',
  borde: '#3a2010',
  card: '#1a0f07',
  acento: '#8b5e3c',
  peligro: '#c0392b',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { perfil } = useAuth()
  const [pacientes, setPacientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [confirmEliminar, setConfirmEliminar] = useState(null)

  useEffect(() => {
    cargarPacientes()
  }, [])

  async function cargarPacientes() {
    setCargando(true)
    let query = supabase
      .from('pacientes')
      .select('id, nombre, apellido, dni, telefono, obra_social, foto_url, creado_en')
      .order('apellido', { ascending: true })

    if (busqueda.trim()) {
      query = query.or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,dni.ilike.%${busqueda}%`)
    }

    const { data } = await query
    setPacientes(data || [])
    setCargando(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => cargarPacientes(), 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  async function eliminarPaciente(id) {
    await supabase.from('pacientes').delete().eq('id', id)
    setConfirmEliminar(null)
    cargarPacientes()
  }

  function fotoUrl(path) {
    if (!path) return null
    const { data } = supabase.storage.from('fotos-pacientes').getPublicUrl(path)
    return data.publicUrl
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.dorado, margin: 0 }}>Pacientes</h1>
          <p style={{ fontSize: 13, color: C.textoMuted, margin: '4px 0 0' }}>
            {pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''} registrado{pacientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/pacientes/nuevo')}
          style={{
            padding: '10px 20px',
            background: `linear-gradient(135deg, ${C.dorado}, ${C.acento})`,
            border: 'none',
            borderRadius: 8,
            color: '#1a0a00',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          + Nuevo Paciente
        </button>
      </div>

      {/* Búsqueda */}
      <input
        type="text"
        placeholder="Buscar por nombre, apellido o DNI..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: C.card,
          border: `1px solid ${C.borde}`,
          borderRadius: 10,
          color: C.doradoClaro,
          fontSize: 14,
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 20,
        }}
      />

      {/* Lista */}
      {cargando ? (
        <div style={{ textAlign: 'center', color: C.textoMuted, padding: 60 }}>Cargando...</div>
      ) : pacientes.length === 0 ? (
        <div style={{ textAlign: 'center', color: C.textoMuted, padding: 60 }}>
          {busqueda ? 'No se encontraron resultados' : 'No hay pacientes registrados'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pacientes.map(p => (
            <div
              key={p.id}
              style={{
                background: C.card,
                border: `1px solid ${C.borde}`,
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onClick={() => navigate(`/pacientes/${p.id}`)}
            >
              {/* Avatar */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: C.acento,
                flexShrink: 0,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: C.doradoClaro,
                fontWeight: 700,
              }}>
                {fotoUrl(p.foto_url)
                  ? <img src={fotoUrl(p.foto_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : `${p.nombre?.[0] || ''}${p.apellido?.[0] || ''}`
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.doradoClaro }}>
                  {p.apellido}, {p.nombre}
                </div>
                <div style={{ fontSize: 13, color: C.textoMuted, marginTop: 2 }}>
                  DNI: {p.dni}{p.obra_social ? ` · ${p.obra_social}` : ''}{p.telefono ? ` · ${p.telefono}` : ''}
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => navigate(`/pacientes/${p.id}/editar`)}
                  style={{
                    padding: '6px 14px',
                    background: 'transparent',
                    border: `1px solid ${C.borde}`,
                    borderRadius: 6,
                    color: C.texto,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Editar
                </button>
                {perfil?.rol === 'doctora' && (
                  <button
                    onClick={() => setConfirmEliminar(p)}
                    style={{
                      padding: '6px 14px',
                      background: 'transparent',
                      border: `1px solid #4a1515`,
                      borderRadius: 6,
                      color: '#f87171',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmEliminar && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: '#1a0f07', border: `1px solid ${C.borde}`, borderRadius: 12,
            padding: 32, maxWidth: 380, width: '90%',
          }}>
            <h3 style={{ color: C.dorado, margin: '0 0 12px' }}>Eliminar paciente</h3>
            <p style={{ color: C.texto, margin: '0 0 24px', fontSize: 14 }}>
              ¿Estás seguro que querés eliminar a <strong>{confirmEliminar.nombre} {confirmEliminar.apellido}</strong>?
              Se eliminarán también todas sus sesiones.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmEliminar(null)}
                style={{ padding: '8px 18px', background: 'transparent', border: `1px solid ${C.borde}`, borderRadius: 6, color: C.texto, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarPaciente(confirmEliminar.id)}
                style={{ padding: '8px 18px', background: '#7f1d1d', border: 'none', borderRadius: 6, color: '#fca5a5', fontWeight: 600, cursor: 'pointer' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
