import OpenAI from "openai";

let openaiInstance = null;

export function getOpenAIClient() {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY no está configurada');
      throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno');
    }
    
    openaiInstance = new OpenAI({
      apiKey: apiKey,
    });
  }
  
  return openaiInstance;
}

export default getOpenAIClient();