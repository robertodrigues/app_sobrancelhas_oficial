import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = "AIzaSyCVTE4q3yA29rKa3PmuL-cVkVYlzzeA3OM";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeEyebrow = async (base64Image: string) => {
  try {
    // Extrai apenas os dados base64, removendo o prefixo 'data:image/jpeg;base64,' se existir
    const base64Data = base64Image.split(',')[1] || base64Image;
    
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings 
    });

    const prompt = `Analise esta sobrancelha. Áreas marcadas: Verde (Início), Amarelo (Meio), Vermelho (Cauda). 
    Retorne APENAS um JSON com: regioes (ponto_inicial, meio, cauda), visao_geral, resumo_geral, objetivo_tratamento, alerta_causa_interna.`;

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
    throw new Error("A IA não retornou um formato válido.");
  } catch (error: any) {
    throw new Error("Gemini: " + (error.message || "Erro na API"));
  }
};