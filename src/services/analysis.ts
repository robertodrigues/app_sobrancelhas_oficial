import { analyzeEyebrow as analyzeWithGemini } from './gemini';
import { analyzeWithClaude } from './claude';

export const performDualAnalysis = async (image: string) => {
  // Tentamos as duas em paralelo para velocidade
  const results = await Promise.allSettled([
    analyzeWithClaude(image),
    analyzeWithGemini(image)
  ]);

  // Prioridade para o Claude, depois Gemini
  const success = results.find(r => r.status === 'fulfilled') as PromiseFulfilledResult<any> | undefined;

  if (success) {
    return success.value;
  }

  // Se ambas falharem, tentamos o Gemini uma última vez com um prompt ainda mais simples
  try {
    console.log("Tentativa de recuperação com Gemini...");
    return await analyzeWithGemini(image);
  } catch (e) {
    throw new Error("Não foi possível processar esta imagem no momento. Tente novamente em instantes.");
  }
};