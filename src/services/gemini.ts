import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCVTE4q3yA29rKa3PmuL-cVkVYlzzeA3OM";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeEyebrow = async (base64Image: string) => {
  try {
    const base64Data = base64Image.split(',')[1] || base64Image;
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    const prompt = `Você é uma assistente especializada em Tricologia de Sobrancelhas.
Analise a imagem (áreas marcadas: Verde=Início, Amarelo=Meio, Vermelho=Cauda) e gere um relatório técnico.

Retorne APENAS o JSON seguindo esta estrutura:
{
  "regioes": {
    "ponto_inicial": {
      "descricao": "Descrição técnica (densidade, pele, espessura)",
      "densidade": "X%",
      "dano": "Tipo e Grau (ex: Dano Misto - Moderado 45%)",
      "espessura": "Fio fino/intermediário/terminal",
      "prognostico": "Resposta esperada",
      "cor": "verde/amarelo/vermelho"
    },
    "meio": { ... },
    "cauda": { ... }
  },
  "visao_geral": "Texto",
  "resumo_geral": "Texto",
  "objetivo_tratamento": "Texto",
  "alerta_causa_interna": "Texto ou null"
}

Critérios Técnicos:
- Densidade: Baixa (15-30%), Média (40-65%), Alta (70-90%).
- Danos: Erro de Design (externo), Estrutural (interno), Misto.
- Escala: Muito leve (10-15%) até Elevado (65-75%).
- Fios: Fino, Intermediário, Terminal.

Use linguagem profissional para ser apresentada à cliente.`;

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