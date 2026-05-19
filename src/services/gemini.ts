import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = "AIzaSyCVTE4q3yA29rKa3PmuL-cVkVYlzzeA3OM";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeEyebrow = async (base64Image: string) => {
  const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

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

  const prompt = `
    Você é uma assistente especializada em Tricologia de Sobrancelhas.
    O usuário marcou áreas específicas na imagem com cores para guiar sua análise:
    - MARCAÇÕES VERDES: Indicam o "Ponto Inicial" (parte mais próxima ao nariz).
    - MARCAÇÕES AMARELAS: Indicam o "Meio da Sobrancelha" (corpo central).
    - MARCAÇÕES VERMELHAS: Indicam a "Cauda" (parte final).

    Analise a imagem focando especialmente nas áreas circuladas ou riscadas com essas cores.
    Gere um relatório técnico completo seguindo exatamente esta estrutura JSON:

    {
      "regioes": {
        "ponto_inicial": { 
          "descricao": "descrição técnica baseada na área verde", 
          "densidade": "porcentagem", 
          "dano": "tipo e grau", 
          "espessura": "fio predominante", 
          "prognostico": "prognóstico",
          "cor": "verde" | "amarelo" | "vermelho"
        },
        "meio": { 
          "descricao": "descrição técnica baseada na área amarela", 
          "densidade": "porcentagem", 
          "dano": "tipo e grau", 
          "espessura": "fio predominante", 
          "prognostico": "prognóstico",
          "cor": "verde" | "amarelo" | "vermelho"
        },
        "cauda": { 
          "descricao": "descrição técnica baseada na área vermelha", 
          "densidade": "porcentagem", 
          "dano": "tipo e grau", 
          "espessura": "fio predominante", 
          "prognostico": "prognóstico",
          "cor": "verde" | "amarelo" | "vermelho"
        }
      },
      "visao_geral": "texto",
      "resumo_geral": "texto",
      "objetivo_tratamento": "texto",
      "alerta_causa_interna": "texto ou null"
    }
  `;

  try {
    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      { text: prompt }
    ]);

    const response = await result.response;
    const text = response.text();
    
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    
    if (start !== -1 && end !== 0) {
      const jsonString = text.substring(start, end);
      return JSON.parse(jsonString);
    }
    
    throw new Error("Formato de resposta inválido");

  } catch (error) {
    console.error("Erro na análise:", error);
    throw error;
  }
};