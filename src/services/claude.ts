import Anthropic from '@anthropic-ai/sdk';
import { RegionBBox } from '@/components/camera/ImageAnnotator';

const API_KEY = "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";

const anthropic = new Anthropic({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
});

const cropImage = (base64Str: string, bbox: RegionBBox): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Erro ao criar contexto canvas');

      const padding = 40;
      const x = Math.max(0, bbox.minX - padding);
      const y = Math.max(0, bbox.minY - padding);
      const width = Math.min(img.width - x, (bbox.maxX - bbox.minX) + (padding * 2));
      const height = Math.min(img.height - y, (bbox.maxY - bbox.minY) + (padding * 2));

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = reject;
    img.src = base64Str;
  });
};

export const analyzeWithClaude = async (originalImage: string, bboxes: Record<string, RegionBBox>) => {
  try {
    const imageContent: any[] = [];
    
    // Adicionar imagem original
    imageContent.push({
      type: "text",
      text: "Imagem 1: Visão Geral da Sobrancelha"
    });
    imageContent.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: originalImage.split(',')[1] }
    });

    // Processar e adicionar recortes
    for (const [name, box] of Object.entries(bboxes)) {
      const croppedData = await cropImage(originalImage, box);
      imageContent.push({
        type: "text",
        text: `Imagem de Detalhe: Região ${name.toUpperCase()}`
      });
      imageContent.push({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: croppedData.split(',')[1] }
      });
    }

    const systemPrompt = `Você é uma especialista em Tricologia de Sobrancelhas. Analise as imagens fornecidas e gere um relatório técnico no formato JSON.

JSON EXATO:
{
  "regioes": {
    "ponto_inicial": { "descricao": "...", "densidade": "...", "exposicao_pele": "...", "espessura": "...", "tipo_dano": "...", "escala_dano": "...", "prognostico": "..." },
    "meio": { "descricao": "...", "densidade": "...", "exposicao_pele": "...", "espessura": "...", "tipo_dano": "...", "escala_dano": "...", "prognostico": "..." },
    "cauda": { "descricao": "...", "densidade": "...", "exposicao_pele": "...", "espessura": "...", "tipo_dano": "...", "escala_dano": "...", "prognostico": "..." }
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
- Use terminologia técnica profissional.
- Baseie-se nos detalhes dos recortes de alta proximidade.`;

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