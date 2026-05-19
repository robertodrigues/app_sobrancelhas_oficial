import { analyzeEyebrow as analyzeWithGemini } from './gemini';
import { analyzeWithClaude } from './claude';

export const performDualAnalysis = async (image: string) => {
  console.log("Iniciando análise combinada...");
  
  const [geminiResult, claudeResult] = await Promise.allSettled([
    analyzeWithGemini(image),
    analyzeWithClaude(image)
  ]);

  if (claudeResult.status === 'fulfilled') {
    console.log("Claude respondeu com sucesso.");
    return claudeResult.value;
  } 
  
  if (geminiResult.status === 'fulfilled') {
    console.log("Gemini respondeu com sucesso.");
    return geminiResult.value;
  }

  // Se ambos falharem, logamos os motivos no console para debug
  console.error("Erro Claude:", (claudeResult as PromiseRejectedResult).reason);
  console.error("Erro Gemini:", (geminiResult as PromiseRejectedResult).reason);

  throw new Error("As IAs não conseguiram processar a imagem. Verifique sua conexão ou tente uma foto mais nítida.");
};