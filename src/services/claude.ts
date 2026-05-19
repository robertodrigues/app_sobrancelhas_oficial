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
      model: "claude-3-5-sonnet-20240620", // Versão estável e amplamente disponível
      max_tokens: 1000,
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
            text: "Analise as marcações coloridas na sobrancelha (Verde: Início, Amarelo: Meio, Vermelho: Cauda) e retorne um JSON técnico com as chaves: regioes, visao_geral, resumo_geral, objetivo_tratamento, alerta_causa_interna." 
          }
        ]
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    
    if (start === -1) throw new Error("Resposta da IA não contém JSON");
    
    return JSON.parse(text.substring(start, end));
  } catch (error: any) {
    console.error("Erro Claude:", error);
    throw new Error("Claude: " + (error.message || "Erro na API"));
  }
};