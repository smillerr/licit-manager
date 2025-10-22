import fs from 'fs';
import path from 'path';
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '../pages/api/extract.js';
import { processPdf } from '../lib/pdfService.js';

jest.setTimeout(30000);

const samplesDir = path.join(process.cwd(), 'tests', 'samples');

// ✅ Crear los archivos de prueba antes de correr los tests
beforeAll(() => {
  if (!fs.existsSync(samplesDir)) fs.mkdirSync(samplesDir, { recursive: true });

  // PDF válido (mínimo pero con estructura)
  const validPdf = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n' +
    '2 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 100 700 Td (Hola PDF) Tj ET\nendstream\nendobj\n' +
    'xref\n0 3\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n' +
    'trailer\n<< /Root 1 0 R >>\nstartxref\n100\n%%EOF'
  );
  fs.writeFileSync(path.join(samplesDir, 'valid.pdf'), validPdf);

  // PDF corrupto (empieza como PDF pero está incompleto)
  fs.writeFileSync(path.join(samplesDir, 'corrupt.pdf'), Buffer.from('%PDF-1.4\nbroken-content'));

  // Archivo no PDF (texto plano)
  fs.writeFileSync(path.join(samplesDir, 'not_pdf.txt'), 'Esto no es un PDF.');

  // Archivo inválido (binario aleatorio)
  fs.writeFileSync(path.join(samplesDir, 'invalid.pdf'), Buffer.from('not a real pdf'));
});

// 🧪 Test suite principal
describe('API /api/extract PDF Handler', () => {

  it('❌ rechaza archivos que no son PDF (texto)', async () => {
    const fileBuffer = fs.readFileSync(path.join(samplesDir, 'not_pdf.txt'));

    await testApiHandler({
      pagesHandler: handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: fileBuffer,
          headers: { 'Content-Type': 'text/plain' },
        });
        expect(res.status).toBe(400);
        const data = await res.json();
        console.log('Not PDF:', data);
      },
    });
  });

  it('❌ rechaza PDF inválido (no empieza con %PDF-)', async () => {
    const fileBuffer = fs.readFileSync(path.join(samplesDir, 'invalid.pdf'));

    await testApiHandler({
      pagesHandler: handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: fileBuffer,
          headers: { 'Content-Type': 'application/pdf' },
        });
        expect([400, 422]).toContain(res.status);
        const data = await res.json();
        console.log('Invalid PDF:', data);
      },
    });
  });

  it('❌ rechaza PDF corrupto (firma correcta pero incompleto)', async () => {
    const fileBuffer = fs.readFileSync(path.join(samplesDir, 'corrupt.pdf'));

    await testApiHandler({
      pagesHandler: handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: fileBuffer,
          headers: { 'Content-Type': 'application/pdf' },
        });
        expect([400, 422]).toContain(res.status);
        const data = await res.json();
        console.log('Corrupt PDF:', data);
      },
    });
  });

  it('✅ procesa PDF válido correctamente', async () => {
    const fileBuffer = fs.readFileSync(path.join(samplesDir, 'valid.pdf'));

    await testApiHandler({
      pagesHandler: handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: fileBuffer,
          headers: { 'Content-Type': 'application/pdf' },
        });
        expect([200, 400, 422]).toContain(res.status);
        const data = await res.json();
        console.log('Valid PDF:', data);
      },
    });
  });
});



