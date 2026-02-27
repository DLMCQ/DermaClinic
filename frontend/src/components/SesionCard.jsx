import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SesionForm from './SesionForm'

const C = {
  dorado: '#c9a96e', doradoClaro: '#e8d5b7', texto: '#d4b896',
  textoMuted: '#7a5a3a', borde: '#3a2010', card: '#221208', acento: '#8b5e3c',
}

export default function SesionCard({ sesion, pacienteId, onActualizar }) {
  const { perfil } = useAuth()
  const [editando, setEditando] = useState(false)
  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [imagenAmpliada, setImagenAmpliada] = useState(null)

  function imgUrl(path) {
    if (!path) return null
    return supabase.storage.from('imagenes-sesiones').getPublicUrl(path).data.publicUrl
  }

  async function guardarEdicion(datos) {
    const { error } = await supabase.from('sesiones').update(datos).eq('id', sesion.id)
    if (error) throw error
    setEditando(false)
    onActualizar()
  }

  async function eliminar() {
    await supabase.from('sesiones').delete().eq('id', sesion.id)
    setConfirmEliminar(false)
    onActualizar()
  }

  function formatFecha(fecha) {
    const [y, m, d] = fecha.split('-')
    return `${d}/${m}/${y}`
  }

  if (editando) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 20 }}>
        <h4 style={{ color: C.dorado, margin: '0 0 16px', fontSize: 14 }}>Editar sesión</h4>
        <SesionForm
          pacienteId={pacienteId}
          inicial={sesion}
          onGuardar={guardarEdicion}
          onCancelar={() => setEditando(false)}
        />
      </div>
    )
  }

  return (
    <>
      <div style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.doradoClaro }}>{sesion.tratamiento}</div>
            <div style={{ fontSize: 12, color: C.textoMuted, marginTop: 3 }}>{formatFecha(sesion.fecha)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEditando(true)} style={{ padding: '4px 12px', background: 'transparent', border: `1px solid ${C.borde}`, borderRadius: 5, color: C.texto, fontSize: 11, cursor: 'pointer' }}>
              Editar
            </button>
            {perfil?.rol === 'doctora' && (
              <button onClick={() => setConfirmEliminar(true)} style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #4a1515', borderRadius: 5, color: '#f87171', fontSize: 11, cursor: 'pointer' }}>
                Eliminar
              </button>
            )}
          </div>
        </div>

        {/* Productos */}
        {sesion.productos && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: C.textoMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Productos</div>
            <div style={{ fontSize: 13, color: C.texto }}>{sesion.productos}</div>
          </div>
        )}

        {/* Notas */}
        {sesion.notas && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: C.textoMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Notas</div>
            <div style={{ fontSize: 13, color: C.texto, whiteSpace: 'pre-wrap' }}>{sesion.notas}</div>
          </div>
        )}

        {/* Imágenes */}
        {(imgUrl(sesion.imagen_antes_url) || imgUrl(sesion.imagen_despues_url)) && (
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            {imgUrl(sesion.imagen_antes_url) && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.textoMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Antes</div>
                <img
                  src={imgUrl(sesion.imagen_antes_url)}
                  alt="Antes"
                  onClick={() => setImagenAmpliada(imgUrl(sesion.imagen_antes_url))}
                  style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in', border: `1px solid ${C.borde}` }}
                />
              </div>
            )}
            {imgUrl(sesion.imagen_despues_url) && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.textoMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Después</div>
                <img
                  src={imgUrl(sesion.imagen_despues_url)}
                  alt="Después"
                  onClick={() => setImagenAmpliada(imgUrl(sesion.imagen_despues_url))}
                  style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in', border: `1px solid ${C.borde}` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal imagen ampliada */}
      {imagenAmpliada && (
        <div
          onClick={() => setImagenAmpliada(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, cursor: 'zoom-out' }}
        >
          <img src={imagenAmpliada} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmEliminar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1a0f07', border: `1px solid ${C.borde}`, borderRadius: 12, padding: 28, maxWidth: 360, width: '90%' }}>
            <h3 style={{ color: C.dorado, margin: '0 0 10px' }}>Eliminar sesión</h3>
            <p style={{ color: C.texto, margin: '0 0 20px', fontSize: 14 }}>¿Eliminás la sesión del {formatFecha(sesion.fecha)}?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmEliminar(false)} style={{ padding: '7px 16px', background: 'transparent', border: `1px solid ${C.borde}`, borderRadius: 6, color: C.texto, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={eliminar} style={{ padding: '7px 16px', background: '#7f1d1d', border: 'none', borderRadius: 6, color: '#fca5a5', fontWeight: 600, cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
