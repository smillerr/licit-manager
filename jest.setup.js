// Mock para fs - versión simplificada y compatible
const fs = jest.requireActual('fs');

jest.mock('fs', () => ({
  ...fs,
  promises: {
    ...fs.promises,
  },
}));

// Mock para path si es necesario
jest.mock('path', () => jest.requireActual('path'));

// Mock para pdfjs-dist para evitar problemas en tests
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn(() => Promise.resolve({
        getTextContent: jest.fn(() => Promise.resolve({
          items: [{ str: 'Texto de prueba del PDF' }]
        }))
      }))
    })
  })),
  GlobalWorkerOptions: {
    workerSrc: ''
  }
}));

// Mock para pdf-parse si lo estás usando
jest.mock('pdf-parse', () => 
  jest.fn(() => Promise.resolve({
    text: 'Texto extraído del PDF mock',
    numpages: 1,
    info: {
      Title: 'Test PDF'
    }
  }))
);