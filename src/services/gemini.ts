import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCVTE4q3yA29rKa3PmuL-cVkVYlzzeA3OM";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeEyebrow = async (image: string, _regions?: any) => {
  try {
    const base64Data = image.split(',')[1] || image;
    // Usando o modelo estável para visão
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro-vision" });
    
    const prompt = `Você é uma especialista em Tricologia de Sobrancelhas. Analise esta imagem e gere um relatório técnico no formato JSON exato abaixo.

JSON EXATO:
{
  "regioes": {
    "ponto_inicial": { "descricao": "...", "densidade": "...", "exposicao_pele": "...", "espessura": "...", "tipo_dano": "...", "escala_dano": "...", "prognostico": "..." },
    "meio": { "descricao": "...", "densidade": "...", "exposicao_pele": "...", "espessura": "...", "tipo_dano": "...", "escala_dano": "...", "prognostico": "..." },
    "cauda": { "descricao": "...", "densidade": "...", "exposicao_pele": "...", "espessura": "...", "tipo_dano": "...", "escala_dano": "...", "prognostico": "..." }
  },
  "melhorias_por_regiao": {
    "ponto_inicial": "cor - justificativa",
    "meio": "cor - justificativa",
    "cauda": "cor - justificativa"
  },
  "visao_geral": "...",
  "resumo_tecnico_geral": "...",
  "objetivo_tratamento": "...",
  "alerta_causa_interna": "..."
}

REGRAS:
- Use terminologia técnica.
- As cores em melhorias_por_regiao devem ser: verde, amarelo ou vermelho.`;

    // Formato SIMPLES: Imagem + Texto
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      },
      { text: prompt }
    ]);

    const response = await result.response;
    const text = response.text();
    
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    
    if (start !== -1) {
      return JSON.parse(text.substring(start, end));
    }
    throw new Error("Formato de resposta inválido.");
  } catch (error: any) {
    console.error("Erro Gemini:", error);
    throw error;
  }
};