export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "No se recibió texto para analizar." });
    }

    console.log('📝 Texto recibido para análisis:', text.length, 'caracteres');

    // Análisis simple sin OpenAI (como fallback)
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).length - 1;
    const paragraphCount = text.split(/\n\s*\n/).length;

    const analysis = `📊 **Análisis del Documento**

**Estadísticas del texto:**
- 📝 ${wordCount} palabras
- 🔤 ${text.length} caracteres
- 📄 ${paragraphCount} párrafos
- 💬 ${sentenceCount} oraciones

**Resumen automático:**
Este documento contiene texto extraído de un PDF. Para un análisis más detallado de los requisitos y puntos clave, se recomienda configurar una API key de OpenAI en el archivo .env.local

**Primeras 200 caracteres:**
"${text.substring(0, 200)}..."`;

    return res.status(200).json({ analysis });

  } catch (error) {
    console.error("❌ Error en análisis:", error);
    return res.status(500).json({ error: "Error interno al procesar el análisis." });
  }
}