-- Appointments table for calendar/scheduling

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  fecha_hora TIMESTAMP NOT NULL,
  duracion_minutos INTEGER DEFAULT 60,
  tratamiento_planeado VARCHAR(255),
  estado VARCHAR(20) DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
  notas TEXT,
  recordatorio_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_paciente ON appointments(paciente_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_fecha ON appointments(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_appointments_estado ON appointments(estado);

-- Comments
COMMENT ON TABLE appointments IS 'Citas/turnos programados';
COMMENT ON COLUMN appointments.estado IS 'Estado: pendiente, confirmada, completada, cancelada';
COMMENT ON COLUMN appointments.recordatorio_enviado IS 'Si se envió recordatorio automático';
COMMENT ON COLUMN appointments.duracion_minutos IS 'Duración estimada en minutos (default: 60)';
