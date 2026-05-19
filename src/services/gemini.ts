import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCVTE4q3yA29rKa3PmuL-cVkVYlzzeA3OM";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeEyebrow = async (base64Image: string) => {
  // Remove o prefixo data:image/jpeg;base64, se existir
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Você é um especialista em Tricologia e Design de Sobrancelhas de alto nível. 
    Analise esta imagem técnica de uma sobrancelha e forneça um diagnóstico detalhado em formato JSON com os seguintes campos:
    - density: (baixa, média ou alta)
    - symmetry_score: (0 a 100)
    - health_status: (descrição curta da saúde dos fios)
    - recommendations: (lista de 3 recomendações profissionais)
    - observations: (um parágrafo curto sobre o que foi observado: falhas, direção do crescimento, etc)

    Responda APENAS o JSON, sem formatação markdown.
  `;

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
  const text = response.text();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Erro ao parsear resposta do Gemini:", text);
    throw new Error("Falha ao processar análise da IA");
  }
};