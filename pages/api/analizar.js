import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "No se recibió texto para analizar." });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres un analista experto que identifica requisitos importantes de documentos técnicos o educativos." },
        { role: "user", content: `Extrae los requisitos o puntos clave más importantes del siguiente texto:\n\n${text}` },
      ],
    });

    const response = completion.choices[0].message.content;
    return res.status(200).json({ analysis: response });

  } catch (error) {
    console.error("Error al analizar:", error);
    return res.status(500).json({ error: "Error interno al procesar el texto." });
  }
}
