import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SesionCard from '../components/SesionCard'
import SesionForm from '../components/SesionForm'
import { generarPDF } from '../components/PDFExport'

const C = {
  dorado: '#c9a96e', doradoClaro: '#e8d5b7', texto: '#d4b896',
  textoMuted: '#7a5a3a', borde: '#3a2010', card: '#1a0f07', acento: '#8b5e3c',
}

export default function DetallePaciente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { perfil } = useAuth()
  const [paciente, setPaciente] = useState(null)
  const [sesiones, setSesiones] = useState([])
  const [nuevaSesion, setNuevaSesion] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [id])

  async function cargar() {
    setCargando(true)
    const [{ data: pac }, { data: ses }] = await Promise.all([
      supabase.from('pacientes').select('*').eq('id', id).single(),
      supabase.from('sesiones').select('*').eq('paciente_id', id).order('fecha', { ascending: false }),
    ])
    setPaciente(pac)
    setSesiones(ses || [])
    setCargando(false)
  }

  async function guardarSesion(datos) {
    const { id: sesId, ...resto } = datos
    const { error } = await supabase.from('sesiones').upsert([{ id: sesId, ...resto }])
    if (error) throw error
    setNuevaSesion(false)
    cargar()
  }

  function fotoUrl() {
    if (!paciente?.foto_url) return null
    return supabase.storage.from('fotos-pacientes').getPublicUrl(paciente.foto_url).data.publicUrl
  }

  function formatFecha(fecha) {
    if (!fecha) return '-'
    const [y, m, d] = fecha.split('-')
    return `${d}/${m}/${y}`
  }

  function calcularEdad(fechaNac) {
    if (!fechaNac) return null
    const hoy = new Date()
    const nac = new Date(fechaNac)
    let edad = hoy.getFullYear() - nac.getFullYear()
    if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--
    return edad
  }

  if (cargando) return <div style={{ color: C.textoMuted, padding: 60, textAlign: 'center' }}>Cargando...</div>
  if (!paciente) return <div style={{ color: C.textoMuted, padding: 60, textAlign: 'center' }}>Paciente no encontrado</div>

  const edad = calcularEdad(paciente.fecha_nacimiento)

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: C.textoMuted, cursor: 'pointer', fontSize: 13, padding: 0 }}>
          ← Volver a pacientes
        </button>
      </div>

      {/* Header paciente */}
      <div style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Foto */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: C.acento,
            flexShrink: 0, overflow: 'hidden', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: C.doradoClaro, border: `2px solid ${C.borde}`,
          }}>
            {fotoUrl()
              ? <img src={fotoUrl()} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : `${paciente.nombre?.[0] || ''}${paciente.apellido?.[0] || ''}`
            }
          </div>

          {/* Info principal */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.doradoClaro, margin: 0 }}>
              {paciente.apellido}, {paciente.nombre}
            </h1>
            <div style={{ color: C.textoMuted, fontSize: 13, marginTop: 4 }}>
              DNI: {paciente.dni}
              {edad !== null && ` · ${edad} años`}
              {paciente.fecha_nacimiento && ` · Nacido/a: ${formatFecha(paciente.fecha_nacimiento)}`}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 14 }}>
              {paciente.telefono && <Dato label="Teléfono" valor={paciente.telefono} />}
              {paciente.email && <Dato label="Email" valor={paciente.email} />}
              {paciente.direccion && <Dato label="Dirección" valor={paciente.direccion} />}
              {paciente.obra_social && <Dato label="Obra Social" valor={`${paciente.obra_social}${paciente.nro_afiliado ? ` · ${paciente.nro_afiliado}` : ''}`} />}
            </div>

            {paciente.motivo_consulta && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#2d1810', borderRadius: 8, borderLeft: `3px solid ${C.acento}` }}>
                <div style={{ fontSize: 10, color: C.textoMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Motivo de Consulta</div>
                <div style={{ fontSize: 13, color: C.texto }}>{paciente.motivo_consulta}</div>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => navigate(`/pacientes/${id}/editar`)}
              style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${C.borde}`, borderRadius: 7, color: C.texto, fontSize: 12, cursor: 'pointer' }}
            >
              Editar
            </button>
            <button
              onClick={() => generarPDF(paciente, sesiones)}
              style={{ padding: '8px 16px', background: `linear-gradient(135deg, ${C.dorado}, ${C.acento})`, border: 'none', borderRadius: 7, color: '#1a0a00', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Sesiones */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.dorado, margin: 0 }}>
            Historial de Sesiones
            <span style={{ fontSize: 13, color: C.textoMuted, fontWeight: 400, marginLeft: 8 }}>({sesiones.length})</span>
          </h2>
          {!nuevaSesion && (
            <button
              onClick={() => setNuevaSesion(true)}
              style={{ padding: '8px 16px', background: `linear-gradient(135deg, ${C.dorado}, ${C.acento})`, border: 'none', borderRadius: 7, color: '#1a0a00', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              + Nueva Sesión
            </button>
          )}
        </div>

        {/* Form nueva sesión */}
        {nuevaSesion && (
          <div style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h4 style={{ color: C.dorado, margin: '0 0 16px', fontSize: 14 }}>Nueva Sesión</h4>
            <SesionForm
              pacienteId={id}
              onGuardar={guardarSesion}
              onCancelar={() => setNuevaSesion(false)}
            />
          </div>
        )}

        {sesiones.length === 0 && !nuevaSesion ? (
          <div style={{ textAlign: 'center', color: C.textoMuted, padding: 40, background: C.card, border: `1px solid ${C.borde}`, borderRadius: 12 }}>
            No hay sesiones registradas todavía
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sesiones.map(s => (
              <SesionCard key={s.id} sesion={s} pacienteId={id} onActualizar={cargar} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Dato({ label, valor }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#5a3a20', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#d4b896' }}>{valor}</div>
    </div>
  )
}
