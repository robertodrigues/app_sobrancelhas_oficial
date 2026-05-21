import Anthropic from '@anthropic-ai/sdk';

const API_KEY = "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";

const anthropic = new Anthropic({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
});

export const analyzeWithClaude = async (originalImage: string, regions: Record<string, string>) => {
  try {
    const imageContent: any[] = [];
    
    // Adicionar imagem original para contexto
    imageContent.push({
      type: "text",
      text: "Imagem 1: Visão Geral da Sobrancelha"
    });
    imageContent.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: originalImage.split(',')[1] }
    });

    // Adicionar recortes específicos
    Object.entries(regions).forEach(([name, data], index) => {
      if (name === 'original') return;
      imageContent.push({
        type: "text",
        text: `Imagem ${index + 2}: Recorte da Região ${name.toUpperCase()}`
      });
      imageContent.push({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: data.split(',')[1] }
      });
    });

    const systemPrompt = `Você é uma especialista em Tricologia de Sobrancelhas. Analise as imagens fornecidas (Visão Geral + Recortes Específicos) e gere um relatório técnico no formato JSON.

IMPORTANTE: Use os recortes específicos para analisar detalhadamente cada região (Início, Meio, Cauda).

ANÁLISE POR REGIÃO:
DENSIDADE: Baixa (15-30%) | Média (40-65%) | Alta (70-90%)
EXPOSIÇÃO DA PELE: "Sim" ou "Não" + descrição
ESPESSURA DOS FIOS: "Fino" | "Intermediário" | "Terminal"
TIPO DE DANO: "Erro de Design" | "Estrutural" | "Misto"
ESCALA DE DANIFICAÇÃO: % e nível
PROGNÓSTICO: Expectativa de tratamento

JSON EXATO:
{
  "regioes": {
    "ponto_inicial": { "descricao": "...", "densidade": "...", "exposicao_pele": "...", "espessura": "...", "tipo_dano": "...", "escala_dano": "...", "prognostico": "..." },
    "meio": { ... },
    "cauda": { ... }
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
- Baseie-se estritamente no que vê nos recortes de alta proximidade.
- Linguagem técnica profissional.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: imageContent }]
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