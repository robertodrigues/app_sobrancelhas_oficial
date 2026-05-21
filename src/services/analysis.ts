import { analyzeWithClaude } from './claude';
import { analyzeWithGPT4o } from './openai';
import { RegionBBox } from '@/components/camera/ImageAnnotator';

export const performDualAnalysis = async (images: {url: string, bboxes: Record<string, RegionBBox>}[]) => {
  console.log("Iniciando análise técnica...");
  
  try {
    console.log("Tentando Claude Sonnet 3.5...");
    const result = await analyzeWithClaude(images);
    return { ...result, iaUsada: 'Claude Sonnet 3.5' };
  } catch (errClaude: any) {
    console.warn('Claude falhou, tentando GPT-4o...', errClaude.message);
    try {
      // Fallback simplificado para GPT-4o (apenas a última imagem por enquanto no fallback)
      const result = await analyzeWithGPT4o(images[images.length - 1].url);
      return { ...result, iaUsada: 'GPT-4o (Fallback)', isComparativo: images.length > 1 };
    } catch (errGPT: any) {
      console.error("Ambas as IAs falharam.");
      throw new Error(`Falha na análise técnica.\nClaude: ${errClaude.message}\nGPT-4o: ${errGPT.message}`);
    }
  }
};