import { analyzeEyebrow as analyzeWithGemini } from './gemini';
import { analyzeWithClaude } from './claude';
import { RegionBBox } from '@/components/camera/ImageAnnotator';

const cropImage = (base64Str: string, bbox: RegionBBox): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Erro ao criar contexto canvas');

      // Adicionar uma margem de segurança de 20% ao redor do recorte
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

export const performDualAnalysis = async (image: string, bboxes: Record<string, RegionBBox>) => {
  console.log("Iniciando recorte das regiões...");
  
  try {
    const croppedRegions: Record<string, string> = {};
    
    // Recortar cada região marcada
    for (const [region, box] of Object.entries(bboxes)) {
      croppedRegions[region] = await cropImage(image, box);
    }

    // Se não houver marcações, envia a imagem original (fallback)
    const regionsToSend = Object.keys(croppedRegions).length > 0 ? croppedRegions : { original: image };

    try {
      return await analyzeWithClaude(image, regionsToSend);
    } catch (e1) {
      console.warn("Claude falhou, tentando Gemini...");
      try {
        return await analyzeWithGemini(image, regionsToSend);
      } catch (e2) {
        console.error("Ambas as IAs falharam.");
        throw e2;
      }
    }
  } catch (error) {
    console.error("Erro no processamento de imagens:", error);
    throw error;
  }
};