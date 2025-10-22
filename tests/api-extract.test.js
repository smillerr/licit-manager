import fs from 'fs';
import path from 'path';
import handler from '../pages/api/extract';

// Configurar timeout más largo para tests
jest.setTimeout(30000);

// Mock para formidable
jest.mock('formidable', () => {
  return jest.fn().mockImplementation((options) => {
    return {
      parse: jest.fn((req, callback) => {
        // Simular diferentes escenarios basados en propiedades del req
        if (req._simulateParseError) {
          callback(new Error('Parse error'), null, null);
        } else if (req._simulateFileSizeError) {
          const error = new Error('File size too large');
          error.code = 'LIMIT_FILE_SIZE';
          callback(error, null, null);
        } else if (req._simulateNoFile) {
          callback(null, {}, {});
        } else if (req._simulateInvalidFile) {
          callback(null, {}, {
            file: {
              filepath: '/tmp/invalid.pdf',
              mimetype: 'text/plain',
              size: 1024
            }
          });
        } else if (req._simulateValidPdf) {
          callback(null, {}, {
            file: {
              filepath: '/tmp/valid.pdf',
              mimetype: 'application/pdf',
              size: 1024
            }
          });
        } else {
          // Caso por defecto: archivo válido
          callback(null, {}, {
            file: {
              filepath: '/tmp/test.pdf',
              mimetype: 'application/pdf',
              size: 1024
            }
          });
        }
      })
    };
  });
});

// Mock para processPdf
jest.mock('../../lib/pdfService', () => ({
  processPdf: jest.fn()
}));

import { processPdf } from '../../lib/pdfService';

describe('API /api/extract PDF Handler', () => {
  let req, res;

  beforeEach(() => {
    req = {
      method: 'POST',
      _simulateParseError: false,
      _simulateFileSizeError: false,
      _simulateNoFile: false,
      _simulateInvalidFile: false,
      _simulateValidPdf: false
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn()
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  it('debe rechazar métodos que no sean POST', async () => {
    req.method = 'GET';
    
    await handler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Método no permitido.' });
  });

  it('debe manejar errores de parse de formidable', async () => {
    req._simulateParseError = true;
    
    await handler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('debe manejar errores de tamaño de archivo', async () => {
    req._simulateFileSizeError = true;
    
    await handler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(413);
  });

  it('debe rechazar cuando no se envía archivo', async () => {
    req._simulateNoFile = true;
    
    await handler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No se recibió archivo.' });
  });

  it('debe rechazar archivos que no son PDF', async () => {
    req._simulateInvalidFile = true;
    
    await handler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo se permiten archivos PDF (.pdf).' });
  });

  it('debe procesar PDF válido correctamente', async () => {
    req._simulateValidPdf = true;
    processPdf.mockResolvedValue('Texto extraído del PDF');
    
    await handler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ text: 'Texto extraído del PDF' });
  });

  it('debe manejar errores en processPdf', async () => {
    req._simulateValidPdf = true;
    processPdf.mockRejectedValue(new Error('PDF corrupto'));
    
    await handler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error al procesar el PDF: PDF corrupto' });
  });

  it('debe rechazar PDF sin texto', async () => {
    req._simulateValidPdf = true;
    processPdf.mockResolvedValue('');
    
    await handler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ error: 'El PDF no contiene texto o está dañado.' });
  });
});