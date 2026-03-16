CREATE TABLE IF NOT EXISTS pacientes (
  id CHAR(36) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  dni VARCHAR(50) NOT NULL,
  fecha_nacimiento DATE,
  telefono VARCHAR(50),
  email VARCHAR(255),
  direccion TEXT,
  obra_social VARCHAR(255),
  nro_afiliado VARCHAR(100),
  motivo_consulta TEXT,
  foto_url TEXT,
  foto_path VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pacientes_dni (dni),
  KEY idx_pacientes_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sesiones (
  id CHAR(36) NOT NULL,
  paciente_id CHAR(36) NOT NULL,
  fecha DATE NOT NULL,
  tratamiento VARCHAR(255) NOT NULL,
  productos TEXT,
  notas TEXT,
  imagen_antes TEXT,
  imagen_despues TEXT,
  imagen_antes_path VARCHAR(500),
  imagen_despues_path VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sesiones_fecha (fecha),
  KEY idx_sesiones_tratamiento (tratamiento),
  CONSTRAINT fk_sesiones_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
