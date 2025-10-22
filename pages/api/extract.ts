import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs';
import path from 'path';
import { processPdf } from '../../lib/pdfService';

export const config = {
  api: { bodyParser: false },
};

interface FileWithPath {
  filepath: string;
  originalFilename?: string;
  mimetype?: string;
  size: number;
  path?: string;
}

interface ApiResponse {
  success?: boolean;
  text?: string;
  metadata?: {
    characters: number;
    words: number;
    lines: number;
    size: number;
    pages: number;
  };
  message?: string;
  error?: string;
  suggestion?: string;
  receivedType?: string;
  maxSize?: string;
  technicalDetails?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Use POST para subir archivos.' });
  }

  console.log('📨 Recibiendo solicitud de extracción PDF');

  // Crear directorio temporal si no existe
  const uploadDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    maxFieldsSize: 10 * 1024 * 1024,
    multiples: false,
  });

  let tempFilePath: string | null = null;

  try {
    // Parsear el formulario
    const { fields, files } = await new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
      form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    let file = files.file as FileWithPath | FileWithPath[];
    if (Array.isArray(file)) file = file[0];
    
    if (!file) {
      return res.status(400).json({ 
        error: 'No se recibió ningún archivo',
        message: 'Por favor, selecciona un archivo PDF para procesar.'
      });
    }

    tempFilePath = file.filepath || file.path || '';
    const mimeType = file.mimetype || '';

    console.log('📁 Archivo recibido:', file.originalFilename, '- Tamaño:', file.size, 'bytes');

    // 1️⃣ Validar tipo MIME
    if (mimeType !== 'application/pdf') {
      cleanTempFile(tempFilePath);
      return res.status(400).json({ 
        error: 'Tipo de archivo no permitido',
        message: 'Solo se aceptan archivos PDF (.pdf).',
        receivedType: mimeType || 'desconocido'
      });
    }

    // 2️⃣ Validar firma PDF (%PDF-)
    try {
      const fd = fs.openSync(tempFilePath, 'r');
      const buffer = Buffer.alloc(5);
      fs.readSync(fd, buffer, 0, 5, 0);
      fs.closeSync(fd);
      
      const header = buffer.toString();
      if (!header.startsWith('%PDF-')) {
        cleanTempFile(tempFilePath);
        return res.status(400).json({ 
          error: 'Archivo no válido',
          message: 'El archivo no es un PDF válido o está dañado.',
          suggestion: 'Por favor, verifica que el archivo sea un PDF correcto.'
        });
      }
    } catch (readError) {
      cleanTempFile(tempFilePath);
      return res.status(400).json({ 
        error: 'Error de lectura',
        message: 'No se pudo leer el archivo PDF.',
        suggestion: 'El archivo podría estar corrupto o inaccesible.'
      });
    }

    // 3️⃣ Validar tamaño mínimo
    try {
      const stats = fs.statSync(tempFilePath);
      if (stats.size < 100) {
        cleanTempFile(tempFilePath);
        return res.status(400).json({ 
          error: 'Archivo vacío',
          message: 'El archivo PDF está vacío o es demasiado pequeño.',
          suggestion: 'Por favor, usa un PDF que contenga datos válidos.'
        });
      }
      
      console.log('✅ PDF validado correctamente - Tamaño:', stats.size, 'bytes');
      
    } catch (statError) {
      cleanTempFile(tempFilePath);
      return res.status(400).json({ 
        error: 'Error de verificación',
        message: 'No se pudo verificar el archivo PDF.',
        suggestion: 'El archivo podría estar corrupto.'
      });
    }

    // 4️⃣ Procesar PDF
    console.log('🔄 Iniciando extracción de texto...');
    const text = await processPdf(tempFilePath);
    
    // Limpiar archivo temporal después del procesamiento exitoso
    cleanTempFile(tempFilePath);

    console.log('🎉 Extracción completada - Texto:', text.length, 'caracteres');

    // Calcular estadísticas
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    const lines = text.split('\n').length;

    return res.status(200).json({ 
      success: true,
      text: text,
      metadata: {
        characters: text.length,
        words: words,
        lines: lines,
        size: file.size,
        pages: Math.ceil(lines / 50) // Estimación aproximada de páginas
      },
      message: `Texto extraído exitosamente: ${words} palabras, ${lines} líneas`
    });

  } catch (err) {
    console.error('💥 Error en el proceso:', (err as Error).message);
    
    // Limpiar archivo temporal en caso de error
    cleanTempFile(tempFilePath);

    const error = err as Error & { code?: string };
    
    // Manejar errores específicos con mensajes útiles al usuario
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'Archivo demasiado grande',
        message: 'El tamaño máximo permitido es 50MB.',
        suggestion: 'Por favor, usa un archivo más pequeño o comprime el PDF.',
        maxSize: '50MB'
      });
    }

    if (error.message.includes('escaneado') || error.message.includes('imagen')) {
      return res.status(422).json({ 
        error: 'PDF escaneado detectado',
        message: 'Este PDF parece ser una imagen escaneada y no contiene texto seleccionable.',
        suggestion: 'Para extraer texto de PDFs escaneados, necesitas usar una herramienta OCR (Reconocimiento Óptico de Caracteres).'
      });
    }

    if (error.message.includes('protegido') || error.message.includes('contraseña')) {
      return res.status(422).json({ 
        error: 'PDF protegido',
        message: 'Este PDF está protegido con contraseña o tiene restricciones de seguridad.',
        suggestion: 'Remueve la protección del PDF antes de intentar extraer el texto.'
      });
    }

    if (error.message.includes('corrupto') || error.message.includes('inválido')) {
      return res.status(422).json({ 
        error: 'PDF dañado',
        message: 'El archivo PDF está corrupto o no es válido.',
        suggestion: 'Intenta abrir el PDF en un visor como Adobe Reader para verificar que no esté dañado.'
      });
    }

    if (error.message.includes('no contiene texto') || error.message.includes('No se encontró texto')) {
      return res.status(422).json({ 
        error: 'Sin texto extraíble',
        message: 'El PDF fue procesado pero no se encontró texto legible.',
        suggestion: 'Esto puede pasar con PDFs que solo contienen imágenes, gráficos o usan fuentes especiales.'
      });
    }

    if (error.message.includes('no encontrado')) {
      return res.status(400).json({ 
        error: 'Archivo no encontrado',
        message: 'El archivo no se pudo encontrar o acceder.',
        suggestion: 'Por favor, vuelve a subir el archivo.'
      });
    }

    // Error genérico
    return res.status(400).json({ 
      error: 'Error al procesar el PDF',
      message: 'Ocurrió un error inesperado al procesar el archivo.',
      technicalDetails: error.message,
      suggestion: 'Por favor, verifica que el archivo sea un PDF válido y vuelve a intentarlo.'
    });
  }
}

// Función auxiliar para limpiar archivos temporales
function cleanTempFile(filePath: string | null): void {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log('🧹 Archivo temporal eliminado');
    } catch (unlinkError) {
      console.error('⚠️ Error eliminando archivo temporal:', (unlinkError as Error).message);
    }
  }
}