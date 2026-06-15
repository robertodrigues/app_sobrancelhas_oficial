import { analyzeWithClaude } from "./claude";
import type { AnalysisImage, AnalysisMode } from "./types";

export const performDualAnalysis = async (images: AnalysisImage[], mode: AnalysisMode = "single") => {
  console.log("Iniciando análise técnica...");

  const result = await analyzeWithClaude(images, mode);
  return {
    ...result,
    iaUsada: "Claude Sonnet 3.5",
    isComparativo: mode === "comparison" || images.length > 1,
    modoAnalise: mode,
  };
};