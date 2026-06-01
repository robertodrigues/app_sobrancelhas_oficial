import { RegionBBox } from '@/components/camera/ImageAnnotator';
import { PROMPT_ESPECIALISTA } from '../constants/prompt';
import type { AnalysisImage } from './types';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://app-sobrancelhas-oficial-5svn.onrender.com';

type AnthropicMessageContent =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } };

const toDataUrl = async (source: string): Promise<string> => {
  if (source.startsWith('data:')) {
    return source;
  }

  const response = await fetch(source, { mode: 'cors' });
  if (!response.ok) {
    throw new Error('Não foi possível carregar a imagem para análise.');
  }

  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Não foi possível converter a imagem para base64.'));
    reader.readAsDataURL(blob);
  });
};

const compressDataUrl = (dataUrl: string, maxSize = 1280, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const needsResize = img.width > maxSize || img.height > maxSize;
      const scale = needsResize ? Math.min(maxSize / img.width, maxSize / img.height) : 1;

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível preparar a imagem.'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => reject(new Error('Não foi possível otimizar a imagem.'));
    img.src = dataUrl;
  });
};

const prepareImageDataUrl = async (source: string): Promise<string> => {
  const dataUrl = await toDataUrl(source);
  return compressDataUrl(dataUrl);
};

const cropImage = async (base64Str: string, bbox: RegionBBox): Promise<string> => {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = base64Str;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Erro ao criar contexto canvas');
  }

  const padding = 28;
  const x = Math.max(0, bbox.minX - padding);
  const y = Math.max(0, bbox.minY - padding);
  const width = Math.min(img.width - x, (bbox.maxX - bbox.minX) + padding * 2);
  const height = Math.min(img.height - y, (bbox.maxY - bbox.minY) + padding * 2);

  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

  return compressDataUrl(canvas.toDataURL('image/jpeg', 0.82), 900, 0.78);
};

export const analyzeWithClaude = async (images: AnalysisImage[]) => {
  try {
    const content: AnthropicMessageContent[] = [];

    for (let i = 0; i < images.length; i++) {
      const label = images.length > 1 ? (i === 0 ? 'ANTES' : 'DEPOIS') : 'VISÃO GERAL';
      const imageDataUrl = await prepareImageDataUrl(images[i].dataUrl ?? images[i].url);

      content.push({ type: 'text', text: `Imagem ${i + 1}: ${label}` });
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: imageDataUrl.split(',')[1],
        },
      });

      for (const [name, box] of Object.entries(images[i].bboxes)) {
        const croppedData = await cropImage(imageDataUrl, box);
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