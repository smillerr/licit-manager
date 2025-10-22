import { NextRequest, NextResponse } from 'next/server';

interface AnalysisResponse {
  analysis?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<AnalysisResponse>> {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "No se recibió texto para analizar." },
        { status: 400 }
      );
    }

    console.log('📝 Texto recibido para análisis:', text.length, 'caracteres');

    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).length - 1;
    const paragraphCount = text.split(/\n\s*\n/).length;

    const analysis = `📊 **Análisis del Documento**

**Estadísticas del texto:**
- 📝 ${wordCount} palabras
- 🔤 ${text.length} caracteres
- 📄 ${paragraphCount} párrafos
- 💬 ${sentenceCount} oraciones

**Primeras 200 caracteres:**
"${text.substring(0, 200)}..."`;

    return NextResponse.json({ analysis });

  } catch (error) {
    console.error("❌ Error en análisis:", error);
    return NextResponse.json(
      { error: "Error interno al procesar el análisis." },
      { status: 500 }
    );
  }
}