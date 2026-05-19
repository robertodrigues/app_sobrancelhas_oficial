import { analyzeEyebrow as analyzeWithGemini } from './gemini';
import { analyzeWithClaude } from './claude';

export const performDualAnalysis = async (image: string) => {
  console.log("Iniciando análise técnica...");
  
  // Tentamos as duas em paralelo
  const results = await Promise.allSettled([
    analyzeWithClaude(image),
    analyzeWithGemini(image)
  ]);

  // Procura o primeiro sucesso
  const success = results.find(r => r.status === 'fulfilled') as PromiseFulfilledResult<any> | undefined;

  if (success) {
    return success.value;
  }

  // Se ambas falharem, pegamos o erro da primeira (Claude) ou da segunda (Gemini)
  const errorClaude = (results[0] as PromiseRejectedResult).reason;
  const errorGemini = (results[1] as PromiseRejectedResult).reason;

  console.error("Erro detalhado Claude:", errorClaude);
  console.error("Erro detalhado Gemini:", errorGemini);

  // Lançamos o erro real para aparecer na tela
  const finalError = errorClaude?.message || errorGemini?.message || "Erro desconhecido nas IAs";
  throw new Error(finalError);
};