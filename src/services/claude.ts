import { RegionBBox } from '@/components/camera/ImageAnnotator';
import { PROMPT_ESPECIALISTA } from '../constants/prompt';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://app-sobrancelhas-oficial-5svn.onrender.com';

type AnthropicMessageContent =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } };

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

export const analyzeWithClaude = async (images: { url: string; bboxes: Record<string, RegionBBox> }[]) => {
  try {
    const content: AnthropicMessageContent[] = [];

    for (let i = 0; i < images.length; i++) {
      const label = images.length > 1 ? (i === 0 ? 'ANTES' : 'DEPOIS') : 'VISÃO GERAL';
      content.push({ type: 'text', text: `Imagem ${i + 1}: ${label}` });
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: images[i].url.split(',')[1],
        },
      });

      for (const [name, box] of Object.entries(images[i].bboxes)) {
        const croppedData = await cropImage(images[i].url, box);
        content.push({ type: 'text', text: `Detalhe ${label} - Região ${name.toUpperCase()}` });
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: croppedData.split(',')[1],
          },
        });
      }
    }

    content.push({ type: 'text', text: PROMPT_ESPECIALISTA });

    const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/anthropic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 2000,
        temperature: 0,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao chamar o proxy da Anthropic');
    }

    const data = await response.json();
    const text = data?.content?.[0]?.type === 'text' ? data.content[0].text : '';
    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}') + 1;
    const result = JSON.parse(clean.substring(start, end));
    return { ...result, isComparativo: images.length > 1 };
  } catch (error: any) {
    console.error('Erro Claude:', error);
    throw error;
  }
};