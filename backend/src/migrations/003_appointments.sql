CREATE TABLE IF NOT EXISTS appointments (
  id CHAR(36) NOT NULL,
  paciente_id CHAR(36) NOT NULL,
  doctor_id CHAR(36),
  fecha_hora DATETIME NOT NULL,
  duracion_minutos INT DEFAULT 60,
  tratamiento_planeado VARCHAR(255),
  estado VARCHAR(20) DEFAULT 'pendiente',
  notas TEXT,
  recordatorio_enviado TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_appointments_fecha (fecha_hora),
  KEY idx_appointments_estado (estado),
  CONSTRAINT chk_appointments_estado CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
  CONSTRAINT fk_appointments_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
