import { analyzeEyebrow as analyzeWithGemini } from './gemini';
import { analyzeWithClaude } from './claude';

export const performDualAnalysis = async (image: string) => {
  console.log("Iniciando análise técnica...");
  
  // Tentamos o Claude primeiro (geralmente mais preciso)
  try {
    return await analyzeWithClaude(image);
  } catch (claudeError: any) {
    console.warn("Claude falhou, tentando Gemini...", claudeError.message);
    
    // Se o Claude falhar, tentamos o Gemini
    try {
      return await analyzeWithGemini(image);
    } catch (geminiError: any) {
      console.error("Ambas as IAs falharam.");
      throw new Error(`Falha na análise: ${claudeError.message} | ${geminiError.message}`);
    }
  }
};