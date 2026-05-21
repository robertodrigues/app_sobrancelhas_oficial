import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCVTE4q3yA29rKa3PmuL-cVkVYlzzeA3OM";
const genAI = new GoogleGenerativeAI(API_KEY);

export const analyzeEyebrow = async (base64Image: string) => {
  try {
    const base64Data = base64Image.split(',')[1] || base64Image;
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    const prompt = `Você é uma especialista em Tricologia de Sobrancelhas. Analise a imagem e gere um relatório técnico no formato JSON abaixo.

ANÁLISE POR REGIÃO (ponto_inicial/verde, meio/amarelo, cauda/vermelho):

Para cada região, analise:
DENSIDADE: Baixa (15-30% - pele exposta, poucos fios) | Média (40-65% - fios presentes com falhas) | Alta (70-90% - boa cobertura)
EXPOSIÇÃO DA PELE: "Sim" ou "Não". Se sim, descreva onde e quanto
ESPESSURA DOS FIOS: "Fino" (nascendo) | "Intermediário" (crescendo) | "Terminal" (encorpado/calibroso)
TIPO DE DANO: "Erro de Design" (remoção excessiva - externo) | "Estrutural" (fator interno - hormonal/nutrição) | "Misto" (ambos)
ESCALA DE DANIFICAÇÃO: "Muito leve (10-15%)" | "Leve (15-40%)" | "Moderado (40-50%)" | "Elevado (65-75%)"
PROGNÓSTICO: Descreva resposta esperada ao tratamento

JSON EXATO que você DEVE retornar (sem alterar os campos):
{
  "regioes": {
    "ponto_inicial": {
      "descricao": "texto detalhado",
      "densidade": "ex: 45% - Média",
      "exposicao_pele": "Sim - falhas entre os fios",
      "espessura": "Fino/Intermediário/Terminal",
      "tipo_dano": "Erro de Design / Estrutural / Misto",
      "escala_dano": "ex: Moderado (45%)",
      "prognostico": "texto da expectativa"
    },
    "meio": {
      "descricao": "texto detalhado",
      "densidade": "ex: 75% - Alta",
      "exposicao_pele": "Não",
      "espessura": "Terminal",
      "tipo_dano": "Nenhum",
      "escala_dano": "Nenhuma",
      "prognostico": "texto da expectativa"
    },
    "cauda": {
      "descricao": "texto detalhado",
      "densidade": "ex: 20% - Baixa",
      "exposicao_pele": "Sim - ausência total em pontos",
      "espessura": "Fino",
      "tipo_dano": "Misto",
      "escala_dano": "ex: Elevado (70%)",
      "prognostico": "texto da expectativa"
    }
  },
  "melhorias_por_regiao": {
    "ponto_inicial": "verde/amarelo/vermelho - justificativa",
    "meio": "verde/amarelo/vermelho - justificativa",
    "cauda": "verde/amarelo/vermelho - justificativa"
  },
  "visao_geral": "texto da visão geral da sobrancelha",
  "resumo_tecnico_geral": "texto do resumo consolidado",
  "objetivo_tratamento": "texto do objetivo",
  "alerta_causa_interna": "texto do alerta ou null"
}

REGRAS:
- Use % reais baseados na imagem
- Linguagem técnica mas acessível para cliente final
- Se houver qualquer sinal de causa interna (fios ralos generalizados, falhas irregulares), preencha o alerta`;

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