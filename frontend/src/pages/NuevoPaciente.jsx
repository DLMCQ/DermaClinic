import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PacienteForm from '../components/PacienteForm'

const C = { dorado: '#c9a96e', textoMuted: '#7a5a3a' }

export default function NuevoPaciente() {
  const navigate = useNavigate()

  async function guardar(datos) {
    const { data, error } = await supabase.from('pacientes').insert([datos]).select().single()
    if (error) throw error
    navigate(`/pacientes/${data.id}`)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.dorado, marginBottom: 8 }}>Nuevo Paciente</h1>
      <p style={{ color: C.textoMuted, marginBottom: 28, fontSize: 13 }}>Completá los datos del paciente</p>
      <div style={{ background: '#1a0f07', border: '1px solid #3a2010', borderRadius: 14, padding: 28 }}>
        <PacienteForm onGuardar={guardar} />
      </div>
    </div>
  )
}
