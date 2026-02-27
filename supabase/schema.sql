-- ============================================================
-- DermaClinic - Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabla de perfiles de usuario (extiende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('doctora', 'recepcionista')),
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  obra_social TEXT,
  nro_afiliado TEXT,
  motivo_consulta TEXT,
  foto_url TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de sesiones / turnos
CREATE TABLE IF NOT EXISTS sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  tratamiento TEXT NOT NULL,
  productos TEXT,
  notas TEXT,
  imagen_antes_url TEXT,
  imagen_despues_url TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON pacientes (nombre);
CREATE INDEX IF NOT EXISTS idx_pacientes_apellido ON pacientes (apellido);
CREATE INDEX IF NOT EXISTS idx_pacientes_dni ON pacientes (dni);
CREATE INDEX IF NOT EXISTS idx_sesiones_paciente ON sesiones (paciente_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha ON sesiones (fecha);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones ENABLE ROW LEVEL SECURITY;

-- Profiles: cada usuario ve solo su propio perfil
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Pacientes: todos los usuarios autenticados pueden leer y escribir
CREATE POLICY "pacientes_select" ON pacientes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pacientes_insert" ON pacientes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "pacientes_update" ON pacientes
  FOR UPDATE TO authenticated USING (true);

-- Solo doctora puede eliminar pacientes (verificado en frontend, aquí como capa extra)
CREATE POLICY "pacientes_delete" ON pacientes
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.rol = 'doctora'
    )
  );

-- Sesiones: todos los usuarios autenticados pueden leer y escribir
CREATE POLICY "sesiones_select" ON sesiones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sesiones_insert" ON sesiones
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "sesiones_update" ON sesiones
  FOR UPDATE TO authenticated USING (true);

-- Solo doctora puede eliminar sesiones
CREATE POLICY "sesiones_delete" ON sesiones
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.rol = 'doctora'
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- (Crear manualmente en: Storage > New Bucket)
-- ============================================================
-- Bucket 1: "fotos-pacientes"   (public: true)
-- Bucket 2: "imagenes-sesiones" (public: true)
--
-- Políticas de Storage (aplicar a cada bucket):
-- Allow authenticated users to upload: (auth.role() = 'authenticated')
-- Allow public read access: true
