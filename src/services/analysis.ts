import { analyzeWithClaude } from './claude';
import { RegionBBox } from '@/components/camera/ImageAnnotator';

export const performDualAnalysis = async (images: {url: string, bboxes: Record<string, RegionBBox>}[]) => {
  console.log("Iniciando análise técnica...");

  const result = await analyzeWithClaude(images);
  return {
    ...result,
    iaUsada: 'Claude Sonnet 3.5',
    isComparativo: images.length > 1,
  };
};