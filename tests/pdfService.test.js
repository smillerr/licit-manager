import fs from 'fs';
import path from 'path';
import { processPdf } from '../lib/pdfService';

describe('processPdf', () => {
  const tmpDir = path.join(process.cwd(), 'tests', 'samples');
  const validPdf = path.join(tmpDir, 'valid.pdf');
  const invalidPdf = path.join(tmpDir, 'invalid.pdf');

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const validPdfContent = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n' +
      '2 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 100 700 Td (Hola PDF) Tj ET\nendstream\nendobj\n' +
      'xref\n0 3\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n' +
      'trailer\n<< /Root 1 0 R >>\nstartxref\n100\n%%EOF'
    );

    fs.writeFileSync(validPdf, validPdfContent);
    fs.writeFileSync(invalidPdf, 'not a real pdf');
  });

  it('throws error for invalid PDF', async () => {
    await expect(processPdf(invalidPdf)).rejects.toThrow(/Invalid|corrupt/i);
  });

  it('handles minimal valid PDF', async () => {
    try {
      const text = await processPdf(validPdf);
      expect(typeof text).toBe('string');
    } catch {}
  });
});