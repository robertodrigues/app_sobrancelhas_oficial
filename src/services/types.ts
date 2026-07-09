import type { RegionBBox } from "@/components/camera/ImageAnnotator";

export type AnalysisMode = "single" | "comparison" | "tricoscopia";
export type DensityRegionKey = "ponto_inicial" | "meio" | "cauda";
export type QuestionnaireAreaKey = DensityRegionKey | "nenhuma";
export type ComparisonEvolutionKey = "sem_evolucao" | "discreta" | "moderada" | "evidente" | "piora";

export interface AnalysisQuestionnaire {
  falha: "Pontual" | "Difusa";
  fiosEmCrescimento: QuestionnaireAreaKey[];
  comparisonEvolution?: Record<DensityRegionKey, ComparisonEvolutionKey>;
  growthArea?: QuestionnaireAreaKey[];
  evolutionFeatures?: string[];
}

export interface AnalysisImage {
  url: string;
  bboxes: Record<string, RegionBBox>;
  dataUrl?: string;
  densities?: Record<string, number>;
  questionnaire?: AnalysisQuestionnaire;
  densityRegion?: DensityRegionKey[];
  densityBBoxes?: Record<string, RegionBBox>;
}
