import { analyzeEyebrow as analyzeWithGemini } from './gemini';
import { analyzeWithClaude } from './claude';

export const performDualAnalysis = async (image: string) => {
  console.log("Iniciando análise combinada (Gemini + Claude)...");
  
  // Executamos ambos em paralelo para ganhar tempo
  const [geminiResult, claudeResult] = await Promise.allSettled([
    analyzeWithGemini(image),
    analyzeWithClaude(image)
  ]);

  // Se ambos funcionarem, podemos combinar ou priorizar um. 
  // Aqui vamos priorizar o Claude por ser mais detalhista, usando o Gemini como backup ou complemento.
  if (claudeResult.status === 'fulfilled') {
    return claudeResult.value;
  } else if (geminiResult.status === 'fulfilled') {
    return geminiResult.value;
  }

  throw new Error("Ambas as IAs falharam na análise.");
};