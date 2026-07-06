import type { AnalysisImage } from "@/services/types";

export type CompactAnalysisImage = {
  url: string;
  bboxes?: AnalysisImage["bboxes"];
  densities?: AnalysisImage["densities"];
  analysisMetrics?: AnalysisImage["analysisMetrics"];
};

export type AnalysisRouteState = {
  analysis: unknown;
  image: string;
  allImages: CompactAnalysisImage[];
};

const compactImages = (images: AnalysisImage[]): CompactAnalysisImage[] =>
  images.map(({ url, bboxes, densities, analysisMetrics }) => ({
    url,
    bboxes,
    densities,
    analysisMetrics,
  }));

export const buildAnalysisRouteState = (
  analysis: unknown,
  image: string,
  images: AnalysisImage[],
): AnalysisRouteState => ({
  analysis,
  image,
  allImages: compactImages(images),
});

export const persistAnalysisRouteState = (state: AnalysisRouteState) => {
  try {
    sessionStorage.setItem("elha:last-analysis", JSON.stringify(state));
  } catch {
    // Se o storage estiver cheio no mobile, seguimos sem bloquear a navegação.
  }
};

export const buildSingleImageState = (
  analysis: unknown,
  image: string,
): AnalysisRouteState => ({
  analysis,
  image,
  allImages: [{ url: image }],
});