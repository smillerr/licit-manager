import type OpenAI from "openai";
import { z } from "zod";

import { openai } from "@/lib/openai/index";

/**
 * Define the JSON schema for our analysis using OpenAI's structured output format.
 * This schema tells the AI exactly what we expect for the licitation analysis.
 */
const analysisSchema: OpenAI.ResponseFormatJSONSchema["json_schema"] = {
  name: "LicitationAnalysis",
  description:
    "Analyze a civil engineering licitation document and extract specific information.",
  schema: {
    type: "object",
    properties: {
      resumen: {
        type: "string",
        description: "Brief summary of the licitation document.",
      },
      experiencia_requerida: {
        type: "string",
        description: "Required experience for the proponent.",
      },
      codigos_exigidos: {
        type: "string",
        description: "Required codes for the interventoría.",
      },
      experiencia_personal: {
        type: "string",
        description:
          "Specific experience required for the personnel linked to the interventoría.",
      },
      indicadores_financieros: {
        type: "string",
        description: "Required financial indicators.",
      },
      documentos_exigidos: {
        type: "string",
        description: "Required documents.",
      },
    },
    required: [
      "resumen",
      "experiencia_requerida",
      "codigos_exigidos",
      "experiencia_personal",
      "indicadores_financieros",
      "documentos_exigidos",
    ],
    additionalProperties: false,
  },
  strict: true,
};

/**
 * Create a Zod schema to validate the API response.
 */
const aiAnalysis = z.object({
  resumen: z.string(),
  experiencia_requerida: z.string(),
  codigos_exigidos: z.string(),
  experiencia_personal: z.string(),
  indicadores_financieros: z.string(),
  documentos_exigidos: z.string(),
});

export type AIAnalysis = z.infer<typeof aiAnalysis>;

import { NextApiRequest, NextApiResponse } from "next";

interface AnalysisResponse {
  success?: boolean;
  analysis?: AIAnalysis;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResponse>
): Promise<void> {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Use POST." });
  }

  const { text } = req.body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Texto requerido para análisis." });
  }

  try {
    const resp = await openai.beta.chat.completions.parse({
      stream: false,
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an AI specialized in analyzing civil engineering licitation documents. Extract the specified information accurately.",
        },
        {
          role: "user",
          content: `Analyze this civil engineering licitation document text and extract the following information: ${text}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: analysisSchema,
      },
    });

    // Parse and validate the response using Zod
    const analysis = aiAnalysis.parse(resp.choices[0]?.message.parsed);

    return res.status(200).json({ success: true, analysis });
  } catch (error) {
    console.error("Error en análisis:", error);
    return res.status(500).json({ error: "Error interno al analizar texto." });
  }
  
}
