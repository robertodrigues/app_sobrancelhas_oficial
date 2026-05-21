import Anthropic from '@anthropic-ai/sdk';

const API_KEY = "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";

const anthropic = new Anthropic({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
});

export const analyzeWithClaude = async (base64Image: string) => {
  try {
    const base64Data = base64Image.split(',')[1] || base64Image;

    const systemPrompt = `Você é uma assistente especializada em Tricologia de Sobrancelhas.
Analise a imagem enviada de acordo com as características individuais de cada sobrancelha na foto e gere um relatório técnico completo seguindo exatamente esta estrutura JSON:

{
  "regioes": {
    "ponto_inicial": {
      "descricao": "Descrição técnica detalhada (densidade, exposição da pele, espessura dos fios)",
      "densidade": "Porcentagem estimada (ex: 45%)",
      "dano": "Tipo e grau de dano (ex: Dano por Erro de Design - Leve 20%)",
      "espessura": "Classificação predominante (Fio fino, intermediário ou terminal)",
      "prognostico": "Expectativa de resposta ao tratamento",
      "cor": "verde, amarelo ou vermelho (baseado na severidade)"
    },
    "meio": { ... mesma estrutura ... },
    "cauda": { ... mesma estrutura ... }
  },
  "visao_geral": "Visão geral da sobrancelha",
  "resumo_geral": "Resumo técnico consolidado",
  "objetivo_tratamento": "Objetivo principal do tratamento",
  "alerta_causa_interna": "String com alerta se houver indício de causa interna, ou null"
}

Diretrizes de Análise:
1. DENSIDADE: Baixa (15-30%), Média (40-65%), Alta (70-90%).
2. ESPESSURA: Fio fino (desenvolvimento), Fio intermediário (crescimento), Fio terminal (calibroso/genético).
3. DANOS: Erro de Design (externo), Estrutural (interno), ou Misto.
4. ESCALA DE DANO: Muito leve (10-15%), Leve (15-40%), Moderado (40-50%), Elevado (65-75%).

Use linguagem técnica e profissional.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: [
          { 
            type: "image", 
            source: { 
              type: "base64", 
              media_type: "image/jpeg", 
              data: base64Data 
            } 
          },
          { 
            type: "text", 
            text: systemPrompt 
          }
        ]
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    return JSON.parse(text.substring(start, end));
  } catch (error: any) {
    console.error("Erro Claude:", error);
    throw error;
  }
};