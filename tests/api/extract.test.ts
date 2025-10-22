/**
 * @jest-environment node
 */

// ========== Mocks globales (se hoistean) ==========

interface MockFile {
  filepath: string;
  originalFilename?: string;
  mimetype?: string;
  size: number;
  path?: string;
}

interface MockRequest {
  method: string;
  _simulateParseError?: boolean;
  _simulateFileSizeError?: boolean;
  _simulateNoFile?: boolean;
  _simulateInvalidFile?: boolean;
  _simulateValidPdf?: boolean;
}

interface MockResponse {
  status: jest.Mock<MockResponse>;
  json: jest.Mock<MockResponse>;
  setHeader: jest.Mock<MockResponse>;
}

// Mock de formidable (incluye originalFilename)
jest.mock('formidable', () => {
  return jest.fn().mockImplementation(() => {
    return {
      parse: jest.fn((req: MockRequest, callback: (err: Error | null, fields: any, files: any) => void) => {
        if (req._simulateParseError) {
          callback(new Error('Parse error'), null, null);
        } else if (req._simulateFileSizeError) {
          const error = new Error('File size too large');
          (error as any).code = 'LIMIT_FILE_SIZE';
          callback(error, null, null);
        } else if (req._simulateNoFile) {
          callback(null, {}, {});
        } else if (req._simulateInvalidFile) {
          callback(null, {}, {
            file: {
              filepath: 'C:\\tmp\\invalid.pdf',
              originalFilename: 'invalid.txt',
              mimetype: 'text/plain',
              size: 1024,
            } as MockFile,
          });
        } else if (req._simulateValidPdf) {
          callback(null, {}, {
            file: {
              filepath: 'C:\\tmp\\valid.pdf',
              originalFilename: 'valid.pdf',
              mimetype: 'application/pdf',
              size: 1024,
            } as MockFile,
          });
        } else {
          // Por defecto: válido
          callback(null, {}, {
            file: {
              filepath: 'C:\\tmp\\test.pdf',
              originalFilename: 'test.pdf',
              mimetype: 'application/pdf',
              size: 1024,
            } as MockFile,
          });
        }
      }),
    };
  });
});

// Mock de fs (APIs síncronas y promesas) — tu handler usa openSync/readSync/closeSync/statSync/unlinkSync
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  const FAKE_FD = 42;
  return {
    ...actual,

    existsSync: jest.fn(() => true),

    // Validación de firma y tamaño
    openSync: jest.fn(() => FAKE_FD),
    readSync: jest.fn((fd: number, buffer: Buffer) => {
      Buffer.from('%PDF-').copy(buffer, 0);
      return 5; // bytes leídos
    }),
    closeSync: jest.fn(() => undefined),
    statSync: jest.fn(() => ({ size: 2048 })), // > 100 bytes

    // Limpieza
    unlinkSync: jest.fn(() => undefined),

    // Promesas (si en el futuro se usan)
    promises: {
      ...actual.promises,
      readFile: jest.fn(async () => Buffer.from('%PDF- dummy content …')),
      unlink:  jest.fn(async () => undefined),
      copyFile:jest.fn(async () => undefined),
      rename:  jest.fn(async () => undefined),
    },
  };
});

// Mock de fs/promises (por si importan esta variante)
jest.mock('fs/promises', () => {
  return {
    readFile: jest.fn(async () => Buffer.from('%PDF- dummy content …')),
    unlink:  jest.fn(async () => undefined),
    copyFile:jest.fn(async () => undefined),
    rename:  jest.fn(async () => undefined),
  };
});

// Mock del servicio PDF (evitamos pdfjs-dist en test)
jest.mock('../../lib/pdfService', () => ({
  processPdf: jest.fn(),
}));

// ========== Imports DESPUÉS de mocks ==========
const mod = require('../../pages/api/extract');
const handler = mod.default || mod;
const { processPdf } = require('../../lib/pdfService');

jest.setTimeout(30000);

// ========== Tests ==========
describe('API /api/extract PDF Handler', () => {
  let req: MockRequest;
  let res: MockResponse;

  beforeEach(() => {
    req = {
      method: 'POST',
      _simulateParseError: false,
      _simulateFileSizeError: false,
      _simulateNoFile: false,
      _simulateInvalidFile: false,
      _simulateValidPdf: false,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  it('debe rechazar métodos que no sean POST', async () => {
    req.method = 'GET';
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Método no permitido. Use POST para subir archivos.',
    });
  });

  it('debe manejar errores de parse de formidable', async () => {
    req._simulateParseError = true;
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400); // tu handler usa 400
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
    expect(res.json).toHaveBeenCalledWith({
      error: 'No se recibió ningún archivo',
      message: 'Por favor, selecciona un archivo PDF para procesar.',
    });
  });

  it('debe rechazar archivos que no son PDF', async () => {
    req._simulateInvalidFile = true;
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Tipo de archivo no permitido',
      message: 'Solo se aceptan archivos PDF (.pdf).',
      receivedType: 'text/plain',
    });
  });

  it('debe procesar PDF válido correctamente', async () => {
    req._simulateValidPdf = true;
    (processPdf as jest.Mock).mockResolvedValue('Texto extraído del PDF');

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    // Tu handler devuelve success, text y metadata; validamos de forma flexible
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      text: 'Texto extraído del PDF',
      metadata: expect.objectContaining({
        characters: expect.any(Number),
        words: expect.any(Number),
        lines: expect.any(Number),
        size: 1024,
        pages: expect.any(Number),
      }),
    }));
  });

  it('debe manejar errores en processPdf', async () => {
    req._simulateValidPdf = true;
    (processPdf as jest.Mock).mockRejectedValue(new Error('PDF corrupto'));

    await handler(req, res);

    // ⬅️ Tu handler responde 422 en este caso
    expect(res.status).toHaveBeenCalledWith(422);
    // No nos acoplamos al copy exacto; validamos que haya una estructura de error
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.any(String),
    }));
  });

  it('debe aceptar PDF con texto vacío (comportamiento actual)', async () => {
    req._simulateValidPdf = true;
    (processPdf as jest.Mock).mockResolvedValue(''); // texto vacío

    await handler(req, res);

    // ⬅️ Tu handler responde 200 y success=true con 0 caracteres
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      text: '',
      metadata: expect.objectContaining({
        characters: 0,
        words: 0,
        // ''.split('\n') === [''] → 1 línea
        lines: expect.any(Number),
      }),
    }));
  });
});