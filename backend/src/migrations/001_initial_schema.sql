-- Initial schema: pacientes and sesiones tables
-- Migrated from sql.js to PostgreSQL

CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  dni VARCHAR(50) NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  telefono VARCHAR(50),
  email VARCHAR(255),
  direccion TEXT,
  obra_social VARCHAR(255),
  nro_afiliado VARCHAR(100),
  motivo_consulta TEXT,
  foto_url TEXT,
  foto_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  tratamiento VARCHAR(255) NOT NULL,
  productos TEXT,
  notas TEXT,
  imagen_antes TEXT,
  imagen_despues TEXT,
  imagen_antes_path VARCHAR(500),
  imagen_despues_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON pacientes(nombre);
CREATE INDEX IF NOT EXISTS idx_pacientes_dni ON pacientes(dni);
CREATE INDEX IF NOT EXISTS idx_sesiones_paciente ON sesiones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha ON sesiones(fecha);
CREATE INDEX IF NOT EXISTS idx_sesiones_tratamiento ON sesiones(tratamiento);

-- Comments
COMMENT ON TABLE pacientes IS 'Tabla de pacientes del sistema';
COMMENT ON TABLE sesiones IS 'Tabla de sesiones de tratamiento';
COMMENT ON COLUMN pacientes.foto_url IS 'Legacy base64 image (to be migrated to foto_path)';
COMMENT ON COLUMN pacientes.foto_path IS 'Path to image file in Railway Volumes';
COMMENT ON COLUMN sesiones.imagen_antes IS 'Legacy base64 (to be migrated to imagen_antes_path)';
COMMENT ON COLUMN sesiones.imagen_despues IS 'Legacy base64 (to be migrated to imagen_despues_path)';
