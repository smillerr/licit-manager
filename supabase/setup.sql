-- Create table for form field definitions
CREATE TABLE form_fields (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  suggestions TEXT[] DEFAULT '{}',
  required BOOLEAN DEFAULT FALSE,
  validation_type TEXT,
  display_order SERIAL
);

-- Insert initial data based on the hardcoded 'initialFields'
INSERT INTO form_fields (id, label, suggestions, required, validation_type, display_order) VALUES
('numero_orden', 'No. de orden', ARRAY['1', '2', '3', '4', '5'], TRUE, 'required', 1),
('numero_rup', 'Número consecutivo del reporte del contrato ejecutado en el RUP', ARRAY[]::TEXT[], FALSE, NULL, 2),
('experiencia_requerida', 'Experiencia requerida para la actividad principal', ARRAY['Experiencia General', 'Experiencia Específica'], TRUE, 'required', 3),
('entidad_contratante', 'Entidad contratante', ARRAY[]::TEXT[], TRUE, 'required', 4),
('numero_contrato', 'Contrato o resolución - No.', ARRAY[]::TEXT[], TRUE, 'required', 5),
('objeto_contrato', 'Contrato o resolución - Objeto', ARRAY[]::TEXT[], TRUE, 'required', 6),
('clasificador_bienes', 'Contrato ejecutado identificado con el clasificador de bienes y servicios', ARRAY[]::TEXT[], FALSE, NULL, 7),
('forma_ejecucion', 'Formas de ejecución', ARRAY['Individual (I)', 'Consorcio (C)', 'Unión Temporal (UT)', 'OTRA'], FALSE, NULL, 8),
('porcentaje_participacion', 'Porcentaje de participación (%)', ARRAY['100%', '50%', '30%', '25%'], FALSE, 'percentage', 9),
('integrante_experiencia', 'Integrante que aporta experiencia', ARRAY[]::TEXT[], FALSE, NULL, 10),
('fecha_iniciacion', 'Fecha de Iniciación [Dia-mes-año]', ARRAY[]::TEXT[], TRUE, 'date', 11),
('fecha_terminacion', 'Fecha de Terminación [Dia-mes-año]', ARRAY[]::TEXT[], TRUE, 'date', 12),
('valor_contrato_smmlv', 'Valor total del contrato en SMMLV', ARRAY[]::TEXT[], TRUE, 'number', 13),
('valor_afectado_participacion', 'Valor total del contrato en SMMLV afectado por el porcentaje de participación', ARRAY[]::TEXT[], FALSE, NULL, 14),
('aplica_lotes', 'Aplica para lotes o grupos', ARRAY['Lote 1', 'Lote 2', 'Lote 3', 'Todos los lotes'], FALSE, NULL, 15);

-- Create table for analysis results (mock data)
CREATE TABLE analysis_results (
  field_id TEXT REFERENCES form_fields(id),
  suggested_value TEXT,
  PRIMARY KEY (field_id)
);

-- Insert mock data
INSERT INTO analysis_results (field_id, suggested_value) VALUES
('entidad_contratante', 'CORPORACIÓN AUTÓNOMA REGIONAL DEL VALLE DEL CAUCA - CVC'),
('objeto_contrato', 'Interventoría de obra pública de infraestructura social'),
('experiencia_requerida', 'Experiencia Específica'),
('forma_ejecucion', 'Individual (I)');

-- Create table for saving user submitted forms
CREATE TABLE submitted_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  form_data JSONB NOT NULL
);

