import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const C = {
  dorado: '#c9a96e',
  doradoClaro: '#e8d5b7',
  texto: '#d4b896',
  textoMuted: '#7a5a3a',
  borde: '#3a2010',
  card: '#1a0f07',
  acento: '#8b5e3c',
  input: '#2d1810',
}

const labelStyle = {
  display: 'block',
  fontSize: 11,
  color: C.textoMuted,
  marginBottom: 6,
  fontWeight: 600,
  letterSpacing: 1,
  textTransform: 'uppercase',
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: C.input,
  border: `1px solid ${C.borde}`,
  borderRadius: 8,
  color: C.doradoClaro,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}

export default function PacienteForm({ inicial = {}, onGuardar }) {
  const navigate = useNavigate()
  const [datos, setDatos] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    fecha_nacimiento: '',
    telefono: '',
    email: '',
    direccion: '',
    obra_social: '',
    nro_afiliado: '',
    motivo_consulta: '',
    ...inicial,
  })
  const [foto, setFoto] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(inicial.foto_url ? null : null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function set(campo, valor) {
    setDatos(d => ({ ...d, [campo]: valor }))
  }

  function handleFoto(e) {
    const archivo = e.target.files[0]
    if (!archivo) return
    if (archivo.size > 5 * 1024 * 1024) {
      setError('La foto no puede superar 5MB')
      return
    }
    setFoto(archivo)
    setFotoPreview(URL.createObjectURL(archivo))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setGuardando(true)

    try {
      let foto_url = inicial.foto_url || null

      if (foto) {
        const ext = foto.name.split('.').pop()
        const path = `${datos.dni || Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('fotos-pacientes')
          .upload(path, foto, { upsert: true })
        if (uploadError) throw uploadError
        foto_url = path
      }

      await onGuardar({ ...datos, foto_url })
    } catch (err) {
      if (err.code === '23505') setError('Ya existe un paciente con ese DNI')
      else setError(err.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  function fotoActualUrl() {
    if (fotoPreview) return fotoPreview
    if (inicial.foto_url) {
      const { data } = supabase.storage.from('fotos-pacientes').getPublicUrl(inicial.foto_url)
      return data.publicUrl
    }
    return null
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: '#3d1515', border: '1px solid #6b2525', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Foto */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: C.acento, margin: '0 auto 12px',
          overflow: 'hidden', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 32, color: C.doradoClaro,
          border: `2px solid ${C.borde}`,
        }}>
          {fotoActualUrl()
            ? <img src={fotoActualUrl()} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '👤'
          }
        </div>
        <label style={{
          padding: '6px 16px', background: 'transparent',
          border: `1px solid ${C.borde}`, borderRadius: 6,
          color: C.texto, fontSize: 12, cursor: 'pointer',
        }}>
          {fotoActualUrl() ? 'Cambiar foto' : 'Subir foto'}
          <input type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
        </label>
      </div>

      {/* Grid de campos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
        <div>
          <label style={labelStyle}>Nombre *</label>
          <input style={inputStyle} value={datos.nombre} onChange={e => set('nombre', e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle}>Apellido *</label>
          <input style={inputStyle} value={datos.apellido} onChange={e => set('apellido', e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle}>DNI *</label>
          <input style={inputStyle} value={datos.dni} onChange={e => set('dni', e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle}>Fecha de Nacimiento</label>
          <input style={inputStyle} type="date" value={datos.fecha_nacimiento} onChange={e => set('fecha_nacimiento', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Teléfono</label>
          <input style={inputStyle} value={datos.telefono} onChange={e => set('telefono', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" value={datos.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Dirección</label>
          <input style={inputStyle} value={datos.direccion} onChange={e => set('direccion', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Obra Social</label>
          <input style={inputStyle} value={datos.obra_social} onChange={e => set('obra_social', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Nro. Afiliado</label>
          <input style={inputStyle} value={datos.nro_afiliado} onChange={e => set('nro_afiliado', e.target.value)} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Motivo de Consulta</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={datos.motivo_consulta}
            onChange={e => set('motivo_consulta', e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${C.borde}`, borderRadius: 8, color: C.texto, cursor: 'pointer' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          style={{ padding: '10px 24px', background: `linear-gradient(135deg, ${C.dorado}, ${C.acento})`, border: 'none', borderRadius: 8, color: '#1a0a00', fontWeight: 700, cursor: 'pointer' }}
        >
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
