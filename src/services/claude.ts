import Anthropic from '@anthropic-ai/sdk';

const API_KEY = "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";

const anthropic = new Anthropic({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
});

export const analyzeWithClaude = async (base64Image: string) => {
  const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/);
  const mimeType = (mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

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
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    
    if (start !== -1 && end !== 0) {
      return JSON.parse(text.substring(start, end));
    }
    throw new Error("Falha ao processar resposta do Claude");
  } catch (error) {
    console.error("Erro no Claude:", error);
    throw error;
  }
};