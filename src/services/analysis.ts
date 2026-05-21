GPT-4o.">
import { analyzeWithClaude } from './claude';
import { analyzeWithGPT4o } from './openai';
import { RegionBBox } from '@/components/camera/ImageAnnotator';

export const performDualAnalysis = async (image: string, bboxes: Record<string, RegionBBox>) => {
  console.log("Iniciando análise técnica...");
  
  try {
    console.log("Tentando Claude Sonnet 3.5...");
    const result = await analyzeWithClaude(image, bboxes);
    return { ...result, iaUsada: 'Claude Sonnet 3.5' };
  } catch (errClaude: any) {
    console.warn('Claude falhou, tentando GPT-4o...', errClaude.message);
    try {
      const result = await analyzeWithGPT4o(image);
      return { ...result, iaUsada: 'GPT-4o (Fallback)' };
    } catch (errGPT: any) {
      console.error("Ambas as IAs falharam.");
      throw new Error(`Falha na análise técnica.\nClaude: ${errClaude.message}\nGPT-4o: ${errGPT.message}`);
    }
  }
};