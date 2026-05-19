import Anthropic from '@anthropic-ai/sdk';

const API_KEY = "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";

const anthropic = new Anthropic({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
});

export const analyzeWithClaude = async (base64Image: string) => {
  const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/);
  const mimeType = (mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg") as any;

  const prompt = `
    Analise esta imagem de sobrancelha para um relatório de visagismo e saúde capilar.
    Ignore imperfeições na foto e foque nas áreas marcadas (Verde: Início, Amarelo: Meio, Vermelho: Cauda).
    Seja prestativa e forneça uma análise técnica mesmo que a imagem não seja ideal.
    
    Retorne o resultado estritamente no formato JSON:
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
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64Data } },
          { type: "text", text: prompt }
        ]
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    return JSON.parse(text.substring(start, end));
  } catch (error) {
    console.error("Erro Claude:", error);
    throw error;
  }
};