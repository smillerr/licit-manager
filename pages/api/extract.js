import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { processPdf } from '../../lib/pdfService';


export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const uploadDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50 MB
  });

  try {
    // Promisificamos form.parse
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    let file = files.file;
    if (Array.isArray(file)) file = file[0];
    if (!file) return res.status(400).json({ error: 'No se recibió archivo.' });

    const filePath = file.filepath || file.path;
    const mimeType = file.mimetype || file.type;

    // 1️⃣ Validar tipo MIME
    if (mimeType !== 'application/pdf') {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Solo se permiten archivos PDF (.pdf).' });
    }

    // 2️⃣ Validar firma PDF (%PDF-)
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(5);
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    if (!buffer.toString().startsWith('%PDF-')) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'El archivo no es un PDF válido o está dañado.' });
    }

    // 3️⃣ Validar tamaño mínimo
    const stats = fs.statSync(filePath);
    if (stats.size < 50) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'El archivo PDF está vacío o corrupto.' });
    }

    // 4️⃣ Procesar PDF
    const text = await processPdf(filePath);
    fs.unlinkSync(filePath);

    if (!text || text.trim().length === 0) {
      return res.status(422).json({ error: 'El PDF no contiene texto o está dañado.' });
    }

    return res.status(200).json({ text });

  } catch (err) {

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo excede el tamaño máximo permitido (50MB).' });
    }
    return res.status(400).json({ error: 'Error al subir o procesar el archivo PDF.' });
  }
}
