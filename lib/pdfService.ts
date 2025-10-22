import fs from 'fs';
import path from 'path';

// Interface para los items de texto de pdfjs-dist
interface TextItem {
  str: string;
}

interface TextContent {
  items: TextItem[];
}

export async function processPdf(filePath: string): Promise<string> {
  console.log('📄 Procesando PDF:', path.basename(filePath));
  
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Archivo no encontrado');
  }
  
  const buffer = await fs.promises.readFile(filePath);
  console.log('📊 Tamaño del buffer:', buffer.length, 'bytes');
  
  validatePdf(buffer);
  
  return await extractWithPdfJsDist(buffer);
}

async function extractWithPdfJsDist(buffer: Buffer): Promise<string> {
  try {
    let pdfjsLib;
    
    try {
      pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    } catch (_e) {
      try {
        pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
      } catch (_e2) {
        pdfjsLib = await import('pdfjs-dist');
      }
    }
    
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
        const textContent = await page.getTextContent() as TextContent;
        const pageText = textContent.items
          .map((item: TextItem) => item.str)
          .filter((str: string) => str.trim().length > 0)
          .join(' ');
        
        if (pageText.trim().length > 0) {
          fullText += pageText + '\n';
        }
      } catch (pageError) {
        console.warn(`Error en página ${i}:`, (pageError as Error).message);
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
    throw new Error('Error al procesar el PDF: ' + (error as Error).message);
  }
}

export const validatePdf = (pdfBuffer: Buffer): boolean => {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('PDF vacío o inválido');
  }
  
  if (pdfBuffer.length < 4 || pdfBuffer.toString('utf8', 0, 4) !== '%PDF') {
    throw new Error('Archivo no es un PDF válido');
  }
  
  return true;
};

function cleanExtractedText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}