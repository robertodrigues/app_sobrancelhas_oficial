import type { RegionBBox } from "@/components/camera/ImageAnnotator";

export type AnalysisMode = "single" | "comparison" | "tricoscopia";

export interface RegionAnalysisMetrics {
  percentual_falha: number;
  percentual_ideal: number;
  area_pixels: number;
  falha_pixels: number;
  ideal_pixels: number;
}

export interface AnalysisImage {
  url: string;
  bboxes: Record<string, RegionBBox>;
  dataUrl?: string;
  densities?: Record<string, number>;
  analysisMetrics?: Record<string, RegionAnalysisMetrics>;
}