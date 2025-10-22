// jest.setup.js - Versión corregida

// Mock para fs - versión simplificada sin variables externas
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    promises: {
      ...originalFs.promises,
    },
  };
});

// Mock para path
jest.mock('path', () => jest.requireActual('path'));

// Mock básico para pdfjs-dist
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn(() => Promise.resolve({
        getTextContent: jest.fn(() => Promise.resolve({
          items: [{ str: 'Texto de prueba del PDF' }]
        }))
      })),
      destroy: jest.fn()
    })
  })),
  GlobalWorkerOptions: {
    workerSrc: ''
  }
}));

// Mock para pdf-parse
jest.mock('pdf-parse', () => 
  jest.fn(() => Promise.resolve({
    text: 'Texto extraído del PDF mock',
    numpages: 1,
    info: {
      Title: 'Test PDF'
    }
  }))
);