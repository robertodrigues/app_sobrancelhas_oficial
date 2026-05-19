import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = "AIzaSyCVTE4q3yA29rKa3PmuL-cVkVYlzzeA3OM";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeEyebrow = async (base64Image: string) => {
  try {
    const base64Data = base64Image.split(',')[1] || base64Image;
    
    // Tentando o modelo flash mais estável
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    const prompt = `Analise esta sobrancelha. Áreas marcadas: Verde (Início), Amarelo (Meio), Vermelho (Cauda). 
    Retorne APENAS um JSON com: regioes, visao_geral, resumo_geral, objetivo_tratamento, alerta_causa_interna.`;

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
      { text: prompt }
    ]);

    const text = result.response.text();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    
    if (start !== -1) {
      return JSON.parse(text.substring(start, end));
    }
    throw new Error("Formato de resposta inválido.");
  } catch (error: any) {
    console.error("Erro Gemini:", error);
    throw new Error("Gemini: " + (error.message || "Erro na API"));
  }
};