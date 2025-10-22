import fs from 'fs';
import path from 'path';

// Mock para pdf-parse
jest.mock('pdf-parse', () => 
  jest.fn((buffer: Buffer) => {
    if (buffer.toString().includes('%PDF')) {
      return Promise.resolve({
        text: 'Texto de prueba del PDF\nEste es un pliego de licitación ejemplo.\nEmpresa: Ejemplo S.A.\nMonto: $100,000',
        numpages: 2,
        info: { Title: 'Pliego de Licitación' }
      });
    } else {
      return Promise.reject(new Error('PDF corrupto o inválido'));
    }
  })
);

// Importar desde la ubicación correcta
import { processPdf, validatePdf } from '../lib/pdfService';

describe('PDF Service - Unit Tests', () => {
  const samplesDir = path.join(process.cwd(), 'tests', 'samples');
  const tempDir = path.join(samplesDir, 'temp');
  
  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('validatePdf', () => {
    it('debe validar buffer PDF correcto', () => {
      const validBuffer = Buffer.from('%PDF-1.4\ncontenido válido');
      expect(validatePdf(validBuffer)).toBe(true);
    });

    it('debe rechazar buffer vacío', () => {
      expect(() => validatePdf(Buffer.alloc(0))).toThrow('PDF vacío o inválido');
    });

    it('debe rechazar buffer nulo', () => {
      expect(() => validatePdf(null as any)).toThrow('PDF vacío o inválido');
    });

    it('debe rechazar archivo que no es PDF', () => {
      const invalidBuffer = Buffer.from('esto no es un pdf');
      expect(() => validatePdf(invalidBuffer)).toThrow('Archivo no es un PDF válido');
    });

    it('debe validar diferentes versiones de PDF', () => {
      const versions = ['%PDF-1.3', '%PDF-1.4', '%PDF-1.5', '%PDF-1.6'];
      versions.forEach(version => {
        const buffer = Buffer.from(version + '\ncontenido');
        expect(validatePdf(buffer)).toBe(true);
      });
    });
  });

  describe('processPdf', () => {
    it('debe procesar PDF válido y extraer texto', async () => {
      const testPdf = path.join(tempDir, 'test-valid.pdf');
      const pdfContent = Buffer.from('%PDF-1.4\nminimal content\n%%EOF');
      fs.writeFileSync(testPdf, pdfContent);

      const result = await processPdf(testPdf);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('Texto de prueba del PDF');
    });

    it('debe lanzar error para archivo inexistente', async () => {
      await expect(processPdf('/ruta/inexistente.pdf')).rejects.toThrow('Archivo no encontrado');
    });

    it('debe limpiar texto extraído correctamente', async () => {
      const testPdf = path.join(tempDir, 'test-clean.pdf');
      const pdfContent = Buffer.from('%PDF-1.4\ncontent\n%%EOF');
      fs.writeFileSync(testPdf, pdfContent);

      const result = await processPdf(testPdf);
      
      expect(result).not.toMatch(/[\x00-\x1F\x7F-\x9F]/);
    });

    it('debe validar PDF antes de procesar', async () => {
      const testPdf = path.join(tempDir, 'test-invalid.pdf');
      fs.writeFileSync(testPdf, 'contenido inválido');

      await expect(processPdf(testPdf)).rejects.toThrow();
    });
  });
});