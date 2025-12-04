'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import ExcelJS from 'exceljs';
import { supabase } from '@/lib/supabaseClient';

interface ExperienceField {
  id: string;
  label: string;
  value: string;
  autoCompleted: boolean;
  suggestions: string[];
  required?: boolean;
  validation?: (value: string) => string | null;
  error?: string;
  validation_type?: string; // Added to help with mapping
}

interface AutoCompleteConfig {
  enabled: boolean;
  showIndicators: boolean;
  confirmChanges: boolean;
}

// Componente memoizado fuera del componente principal
const FieldWithAutoComplete = memo(({ 
  field, 
  config,
  onFieldChange,
  onAcceptSuggestion,
  onRejectSuggestion
}: { 
  field: ExperienceField;
  config: AutoCompleteConfig;
  onFieldChange: (fieldId: string, value: string) => void;
  onAcceptSuggestion: (fieldId: string, suggestion: string) => void;
  onRejectSuggestion: (fieldId: string) => void;
}) => (
  <div className={`p-4 rounded-lg border transition-colors ${
    field.autoCompleted && config.showIndicators
      ? 'border-emerald-500 bg-emerald-50 shadow-sm'
      : 'border-gray-200 bg-white'
  }`}>
    <label className="block text-sm font-medium text-black-900 mb-2">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
      {config.showIndicators && field.autoCompleted && (
        <span className="ml-2 px-2 py-1 text-xs bg-emerald-500 text-white rounded-full font-medium shadow-sm">
          ✓ Auto-completado
        </span>
      )}
    </label>

    <div className="flex gap-2">
      <input
        type="text"
        value={field.value}
        onChange={(e) => onFieldChange(field.id, e.target.value)}
        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white text-gray-900 ${
          field.error 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
        }`}
        placeholder={`Ingrese ${field.label.toLowerCase()}...`}
      />
      
      {field.suggestions.length > 0 && config.enabled && !field.value && (
        <div className="flex gap-1">
          <button
            onClick={() => onAcceptSuggestion(field.id, field.suggestions[0])}
            className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm transition-colors"
            title="Aceptar sugerencia"
          >
            ✓
          </button>
          <button
            onClick={() => onRejectSuggestion(field.id)}
            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm transition-colors"
            title="Rechazar sugerencia"
          >
            ✕
          </button>
        </div>
      )}
    </div>

    {/* Error message */}
    {field.error && (
      <p className="mt-1 text-sm text-red-600">{field.error}</p>
    )}

    {/* Sugerencias disponibles */}
    {field.suggestions.length > 0 && config.enabled && (
      <div className="mt-2">
        <p className="text-xs text-gray-500 mb-1">Sugerencias:</p>
        <div className="flex flex-wrap gap-1">
          {field.suggestions.slice(0, 3).map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onAcceptSuggestion(field.id, suggestion)}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
));

FieldWithAutoComplete.displayName = 'FieldWithAutoComplete';

// Funciones de validación
const validateDate = (value: string): string | null => {
  if (!value) return null;
  const dateRegex = /^\d{1,2}-\d{1,2}-\d{4}$/;
  if (!dateRegex.test(value)) {
    return 'Formato debe ser DD-MM-AAAA';
  }
  return null;
};

const validatePercentage = (value: string): string | null => {
  if (!value) return null;
  const num = parseFloat(value.replace('%', ''));
  if (isNaN(num) || num < 0 || num > 100) {
    return 'Debe ser un porcentaje entre 0 y 100';
  }
  return null;
};

const validateNumber = (value: string): string | null => {
  if (!value) return null;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) {
    return 'Debe ser un número positivo';
  }
  return null;
};

const validateRequired = (value: string): string | null => {
  if (!value || value.trim() === '') {
    return 'Este campo es obligatorio';
  }
  return null;
};

const validationMap: Record<string, (value: string) => string | null> = {
  'required': validateRequired,
  'date': (value) => validateRequired(value) || validateDate(value),
  'percentage': validatePercentage,
  'number': (value) => validateRequired(value) || validateNumber(value),
};

export default function Page3() {
  const [fields, setFields] = useState<ExperienceField[]>([]);
  const [config, setConfig] = useState<AutoCompleteConfig>({
    enabled: true,
    showIndicators: true,
    confirmChanges: true
  });
  const [saved, setSaved] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [savedData, setSavedData] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar campos desde Supabase
  useEffect(() => {
    async function loadFields() {
      try {
        const { data: dbFields, error } = await supabase
          .from('form_fields')
          .select('*')
          .order('display_order');

        if (error) throw error;

        if (dbFields) {
          const mappedFields: ExperienceField[] = dbFields.map((field: any) => ({
            id: field.id,
            label: field.label,
            value: "",
            autoCompleted: false,
            suggestions: field.suggestions || [],
            required: field.required,
            validation: field.validation_type ? validationMap[field.validation_type] : undefined,
            validation_type: field.validation_type
          }));
          setFields(mappedFields);
        }
      } catch (err) {
        console.error('Error loading fields from Supabase:', err);
        // Fallback or alert?
      }
    }
    
    loadFields();
  }, []);

  // Simular datos de análisis previo (desde Supabase)
  useEffect(() => {
    if (isInitialized || fields.length === 0) return;
    
    async function loadAnalysis() {
      try {
        const { data: analysisResults, error } = await supabase
          .from('analysis_results')
          .select('*');

        if (error) throw error;

        if (analysisResults) {
          const mockAnalysisData: Record<string, string> = {};
          analysisResults.forEach((item: any) => {
            mockAnalysisData[item.field_id] = item.suggested_value;
          });

          // Simular delay como en el original
          setTimeout(() => {
            setFields(prev => {
              return prev.map(field => {
                const suggestedValue = mockAnalysisData[field.id];
                if (suggestedValue && !field.value) {
                  return {
                    ...field,
                    value: suggestedValue,
                    autoCompleted: true,
                    suggestions: field.suggestions.includes(suggestedValue) 
                      ? field.suggestions 
                      : [suggestedValue, ...field.suggestions]
                  };
                }
                return field;
              });
            });
            setIsInitialized(true);
          }, 1000);
        }
      } catch (err) {
        console.error('Error loading analysis results:', err);
        setIsInitialized(true);
      }
    }

    loadAnalysis();
  }, [fields.length, isInitialized]);

  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setFields(prev => {
      const updatedFields = prev.map(field => {
        if (field.id === fieldId) {
          const error = field.validation ? field.validation(value) : null;
          return { ...field, value, autoCompleted: false, error: error || undefined };
        }
        return field;
      });

      // Cálculo automático del valor afectado por participación
      if (fieldId === 'valor_contrato_smmlv' || fieldId === 'porcentaje_participacion') {
        const valorContrato = updatedFields.find(f => f.id === 'valor_contrato_smmlv')?.value || '';
        const porcentaje = updatedFields.find(f => f.id === 'porcentaje_participacion')?.value || '';
        
        const valorNum = parseFloat(valorContrato);
        const porcentajeNum = parseFloat(porcentaje.replace('%', ''));
        
        if (!isNaN(valorNum) && !isNaN(porcentajeNum)) {
          const valorAfectado = (valorNum * porcentajeNum / 100).toFixed(2);
          return updatedFields.map(field => 
            field.id === 'valor_afectado_participacion'
              ? { ...field, value: valorAfectado, autoCompleted: true }
              : field
          );
        }
      }

      return updatedFields;
    });
  }, []);

  const acceptSuggestion = useCallback((fieldId: string, suggestion: string) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId 
        ? { ...field, value: suggestion, autoCompleted: true }
        : field
    ));
  }, []);

  const rejectSuggestion = useCallback((fieldId: string) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId 
        ? { ...field, autoCompleted: false, suggestions: field.suggestions.slice(1) }
        : field
    ));
  }, []);

  const handleSave = async () => {
    // Validar todos los campos
    const fieldsWithErrors = fields.map(field => {
      if (field.required && !field.value) {
        return { ...field, error: 'Este campo es obligatorio' };
      }
      if (field.validation && field.value) {
        const error = field.validation(field.value);
        return { ...field, error: error || undefined };
      }
      return field;
    });

    const hasErrors = fieldsWithErrors.some(field => field.error);
    
    if (hasErrors) {
      setFields(fieldsWithErrors);
      alert('Por favor corrija los errores en el formulario antes de guardar');
      return;
    }

    const formData = {
      fecha_creacion: new Date().toLocaleString('es-CO'),
      campos: fields.reduce((acc, field) => {
        acc[field.id] = {
          valor: field.value,
          autoCompletado: field.autoCompleted,
          etiqueta: field.label
        };
        return acc;
      }, {} as Record<string, any>)
    };

    try {
      const { error } = await supabase
        .from('submitted_forms')
        .insert([{ form_data: formData }]);

      if (error) throw error;

      setSavedData(prev => [...prev, formData]);
      setSaved(true);
      localStorage.setItem('formato3_experiencia', JSON.stringify(formData));
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving form to Supabase:', err);
      alert('Error al guardar en la base de datos');
    }
  };

  const downloadExcel = async () => {
    if (fields.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Formato3_Experiencia');

      // Definir columnas
      worksheet.columns = [
        { header: 'No. de orden', key: 'numero_orden', width: 12 },
        { header: 'Número RUP', key: 'numero_rup', width: 20 },
        { header: 'Experiencia Requerida', key: 'experiencia_requerida', width: 22 },
        { header: 'Entidad Contratante', key: 'entidad_contratante', width: 25 },
        { header: 'Número Contrato', key: 'numero_contrato', width: 16 },
        { header: 'Objeto Contrato', key: 'objeto_contrato', width: 40 },
        { header: 'Clasificador Bienes/Servicios', key: 'clasificador_bienes', width: 28 },
        { header: 'Forma Ejecución', key: 'forma_ejecucion', width: 16 },
        { header: 'Porcentaje Participación', key: 'porcentaje_participacion', width: 20 },
        { header: 'Integrante Experiencia', key: 'integrante_experiencia', width: 22 },
        { header: 'Fecha Iniciación', key: 'fecha_iniciacion', width: 16 },
        { header: 'Fecha Terminación', key: 'fecha_terminacion', width: 16 },
        { header: 'Valor Contrato SMMLV', key: 'valor_contrato_smmlv', width: 20 },
        { header: 'Valor Afectado Participación', key: 'valor_afectado_participacion', width: 26 },
        { header: 'Aplica Lotes/Grupos', key: 'aplica_lotes', width: 18 },
        { header: 'Fecha Generación', key: 'fecha_generacion', width: 20 },
        { header: 'Estado', key: 'estado', width: 12 }
      ];

      // Estilo para el encabezado
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E5BFF' }
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Agregar datos
      const rowData: any = {};
      fields.forEach(field => {
        rowData[field.id] = field.value;
      });
      rowData.fecha_generacion = new Date().toLocaleString('es-CO');
      rowData.estado = 'COMPLETADO';

      const row = worksheet.addRow(rowData);
      
      // Estilo para las filas de datos
      row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Generar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Formato3_Experiencia_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error al generar Excel:', error);
      alert('Error al generar el archivo Excel');
    }
  };

  const downloadTemplateExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Template_Formato3');

      // Columnas para el template
      worksheet.columns = [
        { header: 'No. de orden', key: 'numero_orden', width: 12 },
        { header: 'Número consecutivo del reporte del contrato ejecutado en el RUP', key: 'numero_rup', width: 30 },
        { header: 'Experiencia requerida para la actividad principal', key: 'experiencia_requerida', width: 25 },
        { header: 'Entidad contratante', key: 'entidad_contratante', width: 25 },
        { header: 'Contrato o resolución - No.', key: 'numero_contrato', width: 20 },
        { header: 'Contrato o resolución - Objeto', key: 'objeto_contrato', width: 40 },
        { header: 'Contrato ejecutado identificado con el clasificador de bienes y servicios', key: 'clasificador_bienes', width: 35 },
        { header: 'Formas de ejecución', key: 'forma_ejecucion', width: 18 },
        { header: 'Porcentaje de participación (%)', key: 'porcentaje_participacion', width: 22 },
        { header: 'Integrante que aporta experiencia', key: 'integrante_experiencia', width: 25 },
        { header: 'Fecha de Iniciación [Dia-mes-año]', key: 'fecha_iniciacion', width: 20 },
        { header: 'Fecha de Terminación [Dia-mes-año]', key: 'fecha_terminacion', width: 20 },
        { header: 'Valor total del contrato en SMMLV', key: 'valor_contrato_smmlv', width: 25 },
        { header: 'Valor total del contrato en SMMLV afectado por el porcentaje de participación', key: 'valor_afectado_participacion', width: 40 },
        { header: 'Aplica para lotes o grupos', key: 'aplica_lotes', width: 20 }
      ];

      // Estilo del encabezado del template
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B46C1' }
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

      // Agregar fila vacía
      worksheet.addRow({});

      // Generar template
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Template_Formato3_Experiencia.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error al generar template:', error);
      alert('Error al generar el template Excel');
    }
  };

  const loadFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.worksheets[0];
      const row = worksheet.getRow(2); // Suponemos que los datos están en la segunda fila

      if (row) {
        const updatedFields = fields.map(field => {
          // Buscar la columna por key o por header
          let value = '';
          worksheet.columns?.forEach((col, index) => {
            if (col.key === field.id || col.header?.toString().toLowerCase().includes(field.label.toLowerCase())) {
              const cellValue = row.getCell(index + 1).value;
              value = cellValue?.toString() || '';
            }
          });

          if (value) {
            return {
              ...field,
              value: value,
              autoCompleted: true
            };
          }
          return field;
        });

        setFields(updatedFields);
        alert('Datos cargados desde Excel correctamente');
      }
    } catch (error) {
      console.error('Error al cargar Excel:', error);
      alert('Error al cargar el archivo Excel');
    }
  };

  const clearForm = () => {
    setFields(prev => prev.map(field => ({
      ...field,
      value: '',
      autoCompleted: false
    })));
    setSavedData([]);
    localStorage.removeItem('formato3_experiencia');
  };

  const clearAutoCompleted = () => {
    setFields(prev => prev.map(field => ({
      ...field,
      value: field.autoCompleted ? "" : field.value,
      autoCompleted: false
    })));
  };

  // Cargar datos guardados al iniciar (prioriza autosave)
  useEffect(() => {
    // Intentar cargar primero el autoguardado
    const autoSaved = localStorage.getItem('formato3_experiencia_autosave');
    const manualSaved = localStorage.getItem('formato3_experiencia');
    
    // Priorizar autosave si existe, sino usar el guardado manual
    const saved = autoSaved || manualSaved;
    
    if (saved) {
      const parsedData = JSON.parse(saved);
      setFields(prev => prev.map(field => {
        const savedField = parsedData.campos[field.id];
        if (savedField) {
          return {
            ...field,
            value: savedField.valor,
            autoCompleted: savedField.autoCompletado
          };
        }
        return field;
      }));
      setIsInitialized(true); // Marcar como inicializado si hay datos guardados
    }
  }, []);

  // Autoguardado cada 3 segundos
  useEffect(() => {
    if (fields.length === 0) return;

    const autoSaveTimer = setTimeout(() => {
      const hasData = fields.some(field => field.value);
      if (hasData) {
        const formData = {
          fecha_creacion: new Date().toLocaleString('es-CO'),
          campos: fields.reduce((acc, field) => {
            acc[field.id] = {
              valor: field.value,
              autoCompletado: field.autoCompleted,
              etiqueta: field.label
            };
            return acc;
          }, {} as Record<string, any>)
        };
        localStorage.setItem('formato3_experiencia_autosave', JSON.stringify(formData));
        
        // Mostrar notificación de autoguardado
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }
    }, 3000);

    return () => clearTimeout(autoSaveTimer);
  }, [fields]);

  const autoCompletedCount = fields.filter(f => f.autoCompleted).length;
  const manualCompletedCount = fields.filter(f => f.value && !f.autoCompleted).length;
  const pendingCount = fields.filter(f => !f.value).length;

  return (
    <main className="container mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
        Formato 3 - Experiencia Requerida
      </h1>
      <p className="text-gray-600 text-center mb-8">
        Complete la información de experiencia con ayuda del autocompletado inteligente
      </p>

      {/* Panel de control de autocompletado */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold mb-4">Configuración de Autocompletado</h3>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded"
            />
            <span>Activar autocompletado inteligente</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showIndicators}
              onChange={(e) => setConfig(prev => ({ ...prev, showIndicators: e.target.checked }))}
              className="rounded"
            />
            <span>Mostrar indicadores visuales</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.confirmChanges}
              onChange={(e) => setConfig(prev => ({ ...prev, confirmChanges: e.target.checked }))}
              className="rounded"
            />
            <span>Confirmar cambios automáticos</span>
          </label>
        </div>

        {!config.enabled && (
          <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            ⚠️ El autocompletado está desactivado. Los campos no se completarán automáticamente.
          </p>
        )}
      </div>

      {/* Botones de Excel */}
      <div className="flex gap-3 justify-center mb-6 flex-wrap">
        <button
          onClick={downloadTemplateExcel}
          className="px-4 py-2 bg-purple-600 text-black rounded-md hover:bg-purple-700 transition-colors text-sm"
        >
          📥 Descargar Template
        </button>

        <label className="px-6 py-2 bg-gray-600 text-balck rounded-md hover:bg-gray-700 transition-colors shadow-sm font-medium">
          📤 Cargar desde Excel
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={loadFromExcel}
            className="hidden"
          />
        </label>

        <button
          onClick={clearForm}
          className="px-4 py-2 bg-red-600 text-black rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          🗑️ Limpiar Todo
        </button>
      </div>

      {/* Resumen de progreso */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h4 className="font-medium mb-2">Progreso del formulario:</h4>
        <div className="flex gap-6 text-sm">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            Auto-completados: {autoCompletedCount}
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Manuales: {manualCompletedCount}
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            Pendientes: {pendingCount}
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            Total: {fields.length}
          </span>
        </div>
      </div>

      {/* Formulario de experiencia */}
      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {fields.map(field => (
            <FieldWithAutoComplete 
              key={field.id} 
              field={field}
              config={config}
              onFieldChange={handleFieldChange}
              onAcceptSuggestion={acceptSuggestion}
              onRejectSuggestion={rejectSuggestion}
            />
          ))}
        </div>
      </div>

      {/* Botones de acción principales */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={clearAutoCompleted}
          className="px-6 py-2 bg-gray-600 text-balck rounded-md hover:bg-gray-700 transition-colors shadow-sm font-medium"
        >
          Limpiar autocompletados
        </button>
        
        <button
          onClick={handleSave}
          className="ppx-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          💾 Guardar Formulario
        </button>

        <button
          onClick={downloadExcel}
          disabled={fields.every(f => !f.value)}
          className={`px-6 py-2 rounded-md transition-colors font-medium ${
            fields.every(f => !f.value) 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          📊 Descargar Excel
        </button>
      </div>

      {/* Información de datos guardados */}
      {savedData.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Historial de guardados:</h4>
          <div className="text-sm text-gray-600">
            <p>• Formularios guardados: {savedData.length}</p>
            <p>• Último guardado: {new Date().toLocaleString('es-CO')}</p>
            <p>• Los datos también se guardan automáticamente en tu navegador</p>
          </div>
        </div>
      )}

      {/* Notificación de guardado */}
      {saved && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg fade-in z-50">
          ✅ Formulario guardado correctamente
        </div>
      )}

      {/* Notificación de autoguardado */}
      {autoSaved && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg fade-in z-50 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Autoguardado
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Información importante:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Los campos con <span className="text-red-500 font-bold">*</span> son obligatorios</li>
          <li>• Los campos marcados con ✓ verde fueron completados automáticamente</li>
          <li>• El valor afectado por participación se calcula automáticamente</li>
          <li>• Los datos se guardan automáticamente cada 3 segundos</li>
          <li>• Las fechas deben ingresarse en formato DD-MM-AAAA (ej: 15-06-2024)</li>
          <li>• Los porcentajes pueden incluir el símbolo % o solo el número</li>
          <li>• Los valores deben expresarse en Pesos Colombianos convertidos a SMMLV</li>
          <li>• Verifique que la información coincida con los registros en el RUP</li>
        </ul>
      </div>
    </main>
  );
}