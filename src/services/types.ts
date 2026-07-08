import type { RegionBBox } from "@/components/camera/ImageAnnotator";

export type AnalysisMode = "single" | "comparison" | "tricoscopia";
export type DensityRegionKey = "ponto_inicial" | "meio" | "cauda";

export interface AnalysisQuestionnaire {
  falha: "Pontual" | "Difusa";
  fiosEmCrescimento: DensityRegionKey[];
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