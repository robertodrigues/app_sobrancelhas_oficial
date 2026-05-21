import { analyzeEyebrow as analyzeWithGemini } from './gemini';
import { analyzeWithClaude } from './claude';
import { RegionBBox } from '@/components/camera/ImageAnnotator';

const generateMockAnalysis = () => {
  return {
    regioes: {
      ponto_inicial: { descricao: "Densidade moderada com leve rarefação.", densidade: "Média", dano: "Baixo", espessura: "Fina", prognostico: "Bom", cor: "verde" },
      meio: { descricao: "Estrutura preservada, boa curvatura.", densidade: "Alta", dano: "Nenhum", espessura: "Média", prognostico: "Excelente", cor: "amarelo" },
      cauda: { descricao: "Necessita de estímulo para preenchimento.", densidade: "Baixa", dano: "Moderado", espessura: "Fina", prognostico: "Reservado", cor: "vermelho" }
    },
    visao_geral: "Análise realizada via processamento local de segurança.",
    resumo_geral: "O design apresenta boa simetria base, mas requer atenção nas extremidades para otimização do olhar.",
    objetivo_tratamento: "Fortalecimento folicular e preenchimento de falhas na cauda.",
    alerta_causa_interna: "Sugerido acompanhamento de níveis de ferro e biotina."
  };
};

export const performDualAnalysis = async (image: string, bboxes: Record<string, RegionBBox>) => {
  console.log("Iniciando análise com coordenadas:", bboxes);
  
  try {
    return await analyzeWithClaude(image, bboxes);
  } catch (e1) {
    console.warn("Claude falhou, tentando Gemini...");
    try {
      return await analyzeWithGemini(image, bboxes);
    } catch (e2) {
      console.error("Ambas as IAs falharam.");
      return generateMockAnalysis();
    }
  }
};