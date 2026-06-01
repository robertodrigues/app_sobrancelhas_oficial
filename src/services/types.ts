import type { RegionBBox } from "@/components/camera/ImageAnnotator";

export interface AnalysisImage {
  url: string;
  bboxes: Record<string, RegionBBox>;
  dataUrl?: string;
}