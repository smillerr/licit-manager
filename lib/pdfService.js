
import fs from 'fs';
import pdf from 'pdf-parse';

export async function processPdf(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('File not found');
  }
  const buffer = await fs.promises.readFile(filePath);
  try {
    const data = await pdf(buffer);
    let text = data && data.text ? data.text : '';
    text = text.replace(/[\x00-\x1F\x7F]/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    if (!text) {
      throw new Error('No text found in PDF');
    }
    return text;
  } catch (e) {
    // pdf-parse throws for invalid/corrupt PDFs
    throw new Error('Invalid or corrupt PDF');
  }
}
