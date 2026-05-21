import { PROMPT_ESPECIALISTA } from '../constants/prompt';
import { RegionBBox } from '@/components/camera/ImageAnnotator';

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

export async function analyzeWithGPT4o(images: {url: string, bboxes: Record<string, RegionBBox>}[]) {
  const content: any[] = [];

  for (let i = 0; i < images.length; i++) {
    const label = images.length > 1 ? (i === 0 ? "ANTES" : "DEPOIS") : "VISÃO GERAL";
    content.push({ type: 'text', text: `Imagem ${i + 1}: ${label}` });
    content.push({
      type: 'image_url',
      image_url: { url: images[i].url }
    });

    for (const [name, box] of Object.entries(images[i].bboxes)) {
      const croppedData = await cropImage(images[i].url, box);
      content.push({ type: 'text', text: `Detalhe ${label} - Região ${name.toUpperCase()}` });
      content.push({
        type: 'image_url',
        image_url: { url: croppedData }
      });
    }
  }

  content.push({ type: 'text', text: PROMPT_ESPECIALISTA });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_KEY || ""}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: content
      }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`GPT-4o HTTP ${response.status}: ${errorData.error?.message || 'Erro desconhecido'}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;
  const clean = text.replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}') + 1;
  return JSON.parse(clean.substring(start, end));
}