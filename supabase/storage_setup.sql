
-- 5. Configuración de Storage para documentos
-- Habilitar la extensión de almacenamiento si no está (generalmente viene por defecto)

-- Crear un bucket público para licitaciones
INSERT INTO storage.buckets (id, name, public) 
VALUES ('licitaciones', 'licitaciones', true)
ON CONFLICT (id) DO NOTHING;

-- Política de seguridad para permitir subida de archivos (ajusta según necesidad de auth)
-- Permitir lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'licitaciones' );

-- Permitir subida a usuarios autenticados (o a todos por ahora para pruebas)
CREATE POLICY "Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'licitaciones' );

-- Actualizar tabla de documentos para referencia al archivo
ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT;

