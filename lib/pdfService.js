import fs from 'fs';
import path from 'path';

export async function processPdf(filePath) {
  console.log('📄 Procesando PDF:', path.basename(filePath));
  
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Archivo no encontrado');
  }
  
  const buffer = await fs.promises.readFile(filePath);
  console.log('📊 Tamaño del buffer:', buffer.length, 'bytes');
  
  // ✅ AGREGAR ESTA LÍNEA - VALIDACIÓN INTERNA
  validatePdf(buffer);
  
  // Intentar con diferentes rutas
  return await extractWithPdfJsDist(buffer);
}

// ... el resto del código se mantiene igual ...
async function extractWithPdfJsDist(buffer) {
  try {
    let pdfjsLib;
    
    // Intentar diferentes formas de importar
    try {
      // Opción 1: Ruta más común
      pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    } catch (e) {
      try {
        // Opción 2: Sin legacy
        pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
      } catch (e2) {
        // Opción 3: Importación por defecto
        pdfjsLib = await import('pdfjs-dist');
      }
    }
    
    // Asegurarse de que tenemos el getDocument
    const getDocument = pdfjsLib.getDocument || pdfjsLib.default?.getDocument;
    
    if (!getDocument) {
      throw new Error('No se pudo encontrar getDocument en pdfjs-dist');
    }
    
    const uint8Array = new Uint8Array(buffer);
    
    const loadingTask = getDocument({
      data: uint8Array,
      verbosity: 0,
      stopAtErrors: false,
      isEvalSupported: false,
      disableFontFace: true,
      useSystemFonts: true
    });
    
    const pdf = await loadingTask.promise;
    console.log('📑 PDF cargado. Páginas:', pdf.numPages);
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => item.str)
          .filter(str => str.trim().length > 0)
          .join(' ');
        
        if (pageText.trim().length > 0) {
          fullText += pageText + '\n';
        }
      } catch (pageError) {
        console.warn(`Error en página ${i}:`, pageError.message);
      }
    }
    
    const cleanedText = cleanExtractedText(fullText);
    
    if (!cleanedText || cleanedText.trim().length === 0) {
      throw new Error('No se encontró texto en el PDF');
    }
    
    console.log('✅ Texto extraído:', cleanedText.length, 'caracteres');
    return cleanedText;
    
  } catch (error) {
    console.error('Error procesando PDF:', error);
    throw new Error('Error al procesar el PDF: ' + error.message);
  }
}

export const validatePdf = (pdfBuffer) => {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('PDF vacío o inválido');
  }
  
  if (pdfBuffer.length < 4 || pdfBuffer.toString('utf8', 0, 4) !== '%PDF') {
    throw new Error('Archivo no es un PDF válido');
  }
  
  return true;
};

function cleanExtractedText(text) {
  if (!text) return '';
  
  return text
    .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}