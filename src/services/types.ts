import type { RegionBBox } from "@/components/camera/ImageAnnotator";

export type AnalysisMode = "single" | "comparison" | "tricoscopia";

export interface AnalysisImage {
  url: string;
  bboxes: Record<string, RegionBBox>;
  dataUrl?: string;
}