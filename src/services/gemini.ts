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
    Você é uma consultora estética especialista em design e saúde das sobrancelhas.
    Sua missão é analisar a imagem fornecida, independente da qualidade ou ângulo, e fornecer o melhor diagnóstico possível.
    
    O usuário marcou áreas com cores:
    - VERDE: Ponto Inicial
    - AMARELO: Meio/Corpo
    - VERMELHO: Cauda
    
    Mesmo que a imagem esteja borrada ou as marcações não estejam perfeitas, faça uma estimativa técnica baseada no que é visível. Não recuse a análise.
    
    Retorne APENAS um JSON com esta estrutura:
    {
      "regioes": {
        "ponto_inicial": { "descricao": "...", "densidade": "...", "dano": "...", "espessura": "...", "prognostico": "...", "cor": "verde" },
        "meio": { "descricao": "...", "densidade": "...", "dano": "...", "espessura": "...", "prognostico": "...", "cor": "amarelo" },
        "cauda": { "descricao": "...", "densidade": "...", "dano": "...", "espessura": "...", "prognostico": "...", "cor": "vermelho" }
      },
      "visao_geral": "...",
      "resumo_geral": "...",
      "objetivo_tratamento": "...",
      "alerta_causa_interna": "..."
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
      return JSON.parse(text.substring(start, end));
    }
    throw new Error("Resposta inválida");
  } catch (error) {
    console.error("Erro Gemini:", error);
    throw error;
  }
};