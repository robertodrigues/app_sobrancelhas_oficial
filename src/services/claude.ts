import Anthropic from '@anthropic-ai/sdk';
import { RegionBBox } from '@/components/camera/ImageAnnotator';
import { PROMPT_ESPECIALISTA } from '../constants/prompt';

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

export const analyzeWithClaude = async (images: {url: string, bboxes: Record<string, RegionBBox>}[]) => {
  try {
    const imageContent: any[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const label = images.length > 1 ? (i === 0 ? "ANTES" : "DEPOIS") : "VISÃO GERAL";
      imageContent.push({ type: "text", text: `Imagem ${i + 1}: ${label}` });
      imageContent.push({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: images[i].url.split(',')[1] }
      });

      for (const [name, box] of Object.entries(images[i].bboxes)) {
        const croppedData = await cropImage(images[i].url, box);
        imageContent.push({ type: "text", text: `Detalhe ${label} - Região ${name.toUpperCase()}` });
        imageContent.push({
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: croppedData.split(',')[1] }
        });
      }
    }

    imageContent.push({ type: "text", text: PROMPT_ESPECIALISTA });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 2000,
      messages: [{ role: "user", content: imageContent }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}') + 1;
    const result = JSON.parse(clean.substring(start, end));
    return { ...result, isComparativo: images.length > 1 };
  } catch (error: any) {
    console.error("Erro Claude:", error);
    throw error;
  }
};