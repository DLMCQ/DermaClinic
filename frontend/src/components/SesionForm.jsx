import { useState } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  dorado: '#c9a96e', doradoClaro: '#e8d5b7', texto: '#d4b896',
  textoMuted: '#7a5a3a', borde: '#3a2010', input: '#2d1810', acento: '#8b5e3c',
}

const TRATAMIENTOS = [
  'Peeling Químico', 'Hidratación Profunda', 'Luz Pulsada (IPL)',
  'Radiofrecuencia', 'Mesoterapia', 'Microdermoabrasión', 'PRP',
  'Toxina Botulínica', 'Ácido Hialurónico', 'Láser CO2',
  'LED Terapia', 'Limpieza Facial', 'Anti-Acné', 'Despigmentación',
  'Dermatoscopia', 'Otro',
]

const labelStyle = {
  display: 'block', fontSize: 11, color: C.textoMuted,
  marginBottom: 6, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
}
const inputStyle = {
  width: '100%', padding: '10px 12px', background: C.input,
  border: `1px solid ${C.borde}`, borderRadius: 8, color: C.doradoClaro,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

export default function SesionForm({ pacienteId, inicial = {}, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tratamiento: '',
    productos: '',
    notas: '',
    ...inicial,
  })
  const [imagenAntes, setImagenAntes] = useState(null)
  const [imagenDespues, setImagenDespues] = useState(null)
  const [previewAntes, setPreviewAntes] = useState(null)
  const [previewDespues, setPreviewDespues] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function set(campo, valor) {
    setDatos(d => ({ ...d, [campo]: valor }))
  }

  function handleImagen(tipo, e) {
    const archivo = e.target.files[0]
    if (!archivo) return
    if (archivo.size > 5 * 1024 * 1024) { setError('La imagen no puede superar 5MB'); return }
    if (tipo === 'antes') { setImagenAntes(archivo); setPreviewAntes(URL.createObjectURL(archivo)) }
    else { setImagenDespues(archivo); setPreviewDespues(URL.createObjectURL(archivo)) }
  }

  async function subirImagen(archivo, sesionId, tipo) {
    const ext = archivo.name.split('.').pop()
    const path = `${sesionId}/${tipo}.${ext}`
    const { error } = await supabase.storage.from('imagenes-sesiones').upload(path, archivo, { upsert: true })
    if (error) throw error
    return path
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!datos.tratamiento) { setError('Seleccioná un tratamiento'); return }
    setError('')
    setGuardando(true)
    try {
      const sesionId = inicial.id || crypto.randomUUID()
      let imagen_antes_url = inicial.imagen_antes_url || null
      let imagen_despues_url = inicial.imagen_despues_url || null

      if (imagenAntes) imagen_antes_url = await subirImagen(imagenAntes, sesionId, 'antes')
      if (imagenDespues) imagen_despues_url = await subirImagen(imagenDespues, sesionId, 'despues')

      await onGuardar({ id: sesionId, paciente_id: pacienteId, ...datos, imagen_antes_url, imagen_despues_url })
    } catch (err) {
      setError(err.message || 'Error al guardar la sesión')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: '#3d1515', border: '1px solid #6b2525', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
        <div>
          <label style={labelStyle}>Fecha *</label>
          <input style={inputStyle} type="date" value={datos.fecha} onChange={e => set('fecha', e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle}>Tratamiento *</label>
          <select style={inputStyle} value={datos.tratamiento} onChange={e => set('tratamiento', e.target.value)} required>
            <option value="">Seleccionar...</option>
            {TRATAMIENTOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Productos / Materiales utilizados</label>
          <textarea
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
            value={datos.productos}
            onChange={e => set('productos', e.target.value)}
            placeholder="Ej: Ácido glicólico 30%, vitamina C..."
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Notas / Observaciones</label>
          <textarea
            style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
            value={datos.notas}
            onChange={e => set('notas', e.target.value)}
          />
        </div>

        {/* Imágenes */}
        <div>
          <label style={labelStyle}>Imagen Antes</label>
          <ImagenInput
            preview={previewAntes}
            urlActual={inicial.imagen_antes_url}
            bucket="imagenes-sesiones"
            onChange={e => handleImagen('antes', e)}
          />
        </div>
        <div>
          <label style={labelStyle}>Imagen Después</label>
          <ImagenInput
            preview={previewDespues}
            urlActual={inicial.imagen_despues_url}
            bucket="imagenes-sesiones"
            onChange={e => handleImagen('despues', e)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancelar} style={{ padding: '8px 18px', background: 'transparent', border: `1px solid ${C.borde}`, borderRadius: 6, color: C.texto, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button type="submit" disabled={guardando} style={{ padding: '8px 20px', background: `linear-gradient(135deg, ${C.dorado}, ${C.acento})`, border: 'none', borderRadius: 6, color: '#1a0a00', fontWeight: 700, cursor: 'pointer' }}>
          {guardando ? 'Guardando...' : 'Guardar Sesión'}
        </button>
      </div>
    </form>
  )
}

function ImagenInput({ preview, urlActual, bucket, onChange }) {
  const urlPublica = urlActual
    ? supabase.storage.from(bucket).getPublicUrl(urlActual).data.publicUrl
    : null
  const src = preview || urlPublica

  return (
    <label style={{ display: 'block', cursor: 'pointer' }}>
      <div style={{
        width: '100%', height: 120, border: '2px dashed #3a2010',
        borderRadius: 8, display: 'flex', alignItems: 'center',
        justifyContent: 'center', overflow: 'hidden', background: '#2d1810',
      }}>
        {src
          ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: '#5a3a20', fontSize: 13 }}>+ Agregar imagen</span>
        }
      </div>
      <input type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
    </label>
  )
}
