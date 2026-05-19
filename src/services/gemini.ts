import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCVTE4q3yA29rKa3PmuL-cVkVYlzzeA3OM";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeEyebrow = async (base64Image: string) => {
  // Remove o prefixo data:image/jpeg;base64, se existir
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Você é um especialista em Tricologia e Design de Sobrancelhas. 
    Analise esta imagem técnica de uma sobrancelha e forneça um diagnóstico detalhado em formato JSON.
    
    O JSON deve ter exatamente estes campos:
    {
      "density": "baixa" | "média" | "alta",
      "symmetry_score": número de 0 a 100,
      "health_status": "string curta",
      "recommendations": ["string1", "string2", "string3"],
      "observations": "parágrafo curto"
    }

    IMPORTANTE: Responda APENAS o objeto JSON puro. Não use blocos de código markdown.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Limpeza de possíveis blocos de código markdown que a IA possa enviar por engano
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(text);
  } catch (e) {
    console.error("Erro na análise Gemini:", e);
    throw new Error("Falha ao processar análise da IA. Verifique a imagem e tente novamente.");
  }
};