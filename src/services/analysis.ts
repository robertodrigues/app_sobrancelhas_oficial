import { analyzeWithClaude } from './claude';
import type { AnalysisImage } from './types';

export const performDualAnalysis = async (images: AnalysisImage[]) => {
  console.log("Iniciando análise técnica...");

  const result = await analyzeWithClaude(images);
  return {
    ...result,
    iaUsada: 'Claude Sonnet 3.5',
    isComparativo: images.length > 1,
  };
};