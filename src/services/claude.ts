import Anthropic from '@anthropic-ai/sdk';

const API_KEY = "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";

const anthropic = new Anthropic({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
});

export const analyzeWithClaude = async (base64Image: string) => {
  try {
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest", // Usando o alias mais recente
      max_tokens: 1024,
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
            text: "Analise esta sobrancelha e retorne um JSON com as chaves: regioes, visao_geral, resumo_geral, objetivo_tratamento, alerta_causa_interna." 
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
    // Se o 3.5 falhar, tentamos o Haiku como último recurso
    if (error.status === 404) {
       throw new Error("Modelo Claude não encontrado. Verifique as permissões da chave.");
    }
    throw error;
  }
};