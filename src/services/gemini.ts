import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCVTE4q3yA29rKa3PmuL-cVkVYlzzeA3OM";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeEyebrow = async (originalImage: string, regions: Record<string, string>) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const promptParts: any[] = [];
    
    promptParts.push("Você é uma especialista em Tricologia de Sobrancelhas. Analise as imagens abaixo (Visão Geral + Recortes Específicos) e gere um relatório técnico JSON.");
    
    // Adicionar imagem original
    promptParts.push("Imagem de Visão Geral:");
    promptParts.push({ inlineData: { data: originalImage.split(',')[1], mimeType: "image/jpeg" } });

    // Adicionar recortes
    Object.entries(regions).forEach(([name, data]) => {
      if (name === 'original') return;
      promptParts.push(`Recorte da Região ${name.toUpperCase()}:`);
      promptParts.push({ inlineData: { data: data.split(',')[1], mimeType: "image/jpeg" } });
    });

    promptParts.push(`
JSON EXATO que você DEVE retornar:
{
  "regioes": {
    "ponto_inicial": { "descricao": "...", "densidade": "...", "exposicao_pele": "...", "espessura": "...", "tipo_dano": "...", "escala_dano": "...", "prognostico": "..." },
    "meio": { ... },
    "cauda": { ... }
  },
  "melhorias_por_regiao": {
    "ponto_inicial": "verde/amarelo/vermelho - justificativa",
    "meio": "verde/amarelo/vermelho - justificativa",
    "cauda": "verde/amarelo/vermelho - justificativa"
  },
  "visao_geral": "...",
  "resumo_tecnico_geral": "...",
  "objetivo_tratamento": "...",
  "alerta_causa_interna": "..."
}

REGRAS:
- Analise os detalhes microscópicos nos recortes.
- Use terminologia técnica de tricologia.`);

    const result = await model.generateContent(promptParts);
    const text = result.response.text();
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