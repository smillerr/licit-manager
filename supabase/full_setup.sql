-- 1. Tabla de Usuarios (Extendiendo si es necesario, aunque NextAuth maneja sesiones, es bueno tener un registro local si no usamos el auth de supabase nativo al 100%)
-- Por simplicidad y compatibilidad con NextAuth Credentials, crearemos una tabla simple de usuarios.
CREATE TABLE IF NOT EXISTS app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- En producción esto debe ser hash, aquí simularemos simple para que coincida con tu login actual
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insertar usuario admin por defecto (el mismo que usas en el login quemado)
INSERT INTO app_users (email, password, name, role)
VALUES ('admin@test.com', '123456', 'Administrador', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 2. Tabla de Licitaciones
CREATE TABLE IF NOT EXISTS licitaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  entidad TEXT NOT NULL,
  estado TEXT CHECK (estado IN ('Activa', 'En revisión', 'Finalizada', 'Pendiente')) DEFAULT 'Activa',
  fecha_publicacion DATE DEFAULT CURRENT_DATE,
  descripcion TEXT,
  presupuesto NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insertar datos de ejemplo iniciales para que el dashboard no se vea vacío
INSERT INTO licitaciones (titulo, entidad, estado, fecha_publicacion, presupuesto) VALUES
('Adquisición de equipos de cómputo', 'Ministerio de Salud', 'Activa', '2025-11-21', 500000000),
('Mantenimiento de malla vial', 'Alcaldía de Bogotá', 'En revisión', '2025-11-20', 1200000000),
('Consultoría jurídica especializada', 'Gobernación de Cundinamarca', 'Finalizada', '2025-11-19', 80000000),
('Suministro de papelería', 'SENA', 'Activa', '2025-12-01', 25000000),
('Interventoría obra colegio', 'Secretaría de Educación', 'Pendiente', '2025-12-05', 150000000);

-- 3. Tabla de Documentos (para contar "Documentos analizados")
CREATE TABLE IF NOT EXISTS documentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT,
  estado_analisis TEXT DEFAULT 'Completado',
  licitacion_id UUID REFERENCES licitaciones(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insertar documentos de prueba (vinculados a ninguna licitación específica por ahora o genéricos)
INSERT INTO documentos (nombre, tipo, estado_analisis) 
SELECT 'Documento ' || generate_series(1, 183), 'PDF', 'Completado';

-- 4. Tabla de Alertas (para "Alertas generadas")
CREATE TABLE IF NOT EXISTS alertas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mensaje TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('Info', 'Warning', 'Error', 'Success')),
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insertar alertas de prueba
INSERT INTO alertas (mensaje, tipo, created_at) VALUES
('Nueva licitación compatible encontrada', 'Success', NOW()),
('Documento incompleto en licitación 001', 'Warning', NOW()),
('Fecha límite próxima para entrega', 'Error', NOW()),
('Actualización de términos de referencia', 'Info', NOW() - INTERVAL '1 day'),
('Requisito de experiencia no cumplido', 'Warning', NOW() - INTERVAL '2 days'),
('Nuevo documento cargado', 'Info', NOW() - INTERVAL '3 days'),
('Error al procesar archivo PDF', 'Error', NOW() - INTERVAL '4 days'),
('Licitación adjudicada', 'Success', NOW() - INTERVAL '5 days'),
('Cambio de cronograma', 'Info', NOW() - INTERVAL '6 days');

