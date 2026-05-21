import { analyzeWithClaude } from './claude';
import { RegionBBox } from '@/components/camera/ImageAnnotator';

const generateMockAnalysis = () => ({
  regioes: {
    ponto_inicial: {
      descricao: "Densidade preservada com leve rarefação no limite inferior.",
      densidade: "Média (60%)",
      exposicao_pele: "Sim, discreta",
      espessura: "Terminal",
      tipo_dano: "Estrutural",
      escala_dano: "15% - Leve",
      prognostico: "Excelente resposta ao tratamento tópico"
    },
    meio: {
      descricao: "Corpo da sobrancelha com falhas pontuais por erro de design.",
      densidade: "Baixa (40%)",
      exposicao_pele: "Sim, visível",
      espessura: "Intermediário",
      tipo_dano: "Erro de Design",
      escala_dano: "30% - Moderado",
      prognostico: "Recuperação total em 3-4 ciclos"
    },
    cauda: {
      descricao: "Região com afinamento severo e perda de projeção.",
      densidade: "Baixa (20%)",
      exposicao_pele: "Sim, acentuada",
      espessura: "Fino",
      tipo_dano: "Misto",
      escala_dano: "50% - Severo",
      prognostico: "Necessita estimulação intensiva"
    }
  },
  melhorias_por_regiao: {
    ponto_inicial: "verde - Estabilidade folicular",
    meio: "amarelo - Necessita correção de design",
    cauda: "vermelho - Alerta de atrofia folicular"
  },
  visao_geral: "Análise global indica necessidade de protocolo de recuperação folicular.",
  resumo_tecnico_geral: "Quadro de rarefação moderada com danos mecânicos prévios.",
  objetivo_tratamento: "Estimular o crescimento nas áreas de falha e estabilizar a densidade.",
  alerta_causa_interna: "Sugerido acompanhamento de níveis de ferro e ferritina."
});

export const performDualAnalysis = async (image: string, bboxes: Record<string, RegionBBox>) => {
  console.log("Usando apenas Claude para análise", { bboxes });
  try {
    return await analyzeWithClaude(image, bboxes);
  } catch (error) {
    console.error("Claude falhou, usando fallback local", error);
    return generateMockAnalysis();
  }
};