import Anthropic from '@anthropic-ai/sdk';

const API_KEY = "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";

const anthropic = new Anthropic({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
});

export const analyzeWithClaude = async (base64Image: string) => {
  try {
    const base64Data = base64Image.split(',')[1] || base64Image;

    const systemPrompt = `Você é uma especialista em Tricologia de Sobrancelhas. Analise a imagem e gere um relatório técnico no formato JSON abaixo.

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

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 2000,
      system: systemPrompt,
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