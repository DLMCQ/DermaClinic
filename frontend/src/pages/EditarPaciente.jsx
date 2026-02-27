import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PacienteForm from '../components/PacienteForm'

const C = { dorado: '#c9a96e', textoMuted: '#7a5a3a' }

export default function EditarPaciente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [paciente, setPaciente] = useState(null)

  useEffect(() => {
    supabase.from('pacientes').select('*').eq('id', id).single()
      .then(({ data }) => setPaciente(data))
  }, [id])

  async function guardar(datos) {
    const { error } = await supabase
      .from('pacientes')
      .update({ ...datos, actualizado_en: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    navigate(`/pacientes/${id}`)
  }

  if (!paciente) return <div style={{ color: '#7a5a3a', padding: 60, textAlign: 'center' }}>Cargando...</div>

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.dorado, marginBottom: 8 }}>Editar Paciente</h1>
      <p style={{ color: C.textoMuted, marginBottom: 28, fontSize: 13 }}>
        {paciente.apellido}, {paciente.nombre}
      </p>
      <div style={{ background: '#1a0f07', border: '1px solid #3a2010', borderRadius: 14, padding: 28 }}>
        <PacienteForm inicial={paciente} onGuardar={guardar} />
      </div>
    </div>
  )
}
