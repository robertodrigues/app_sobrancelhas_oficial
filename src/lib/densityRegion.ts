import type { RegionBBox } from "@/components/camera/ImageAnnotator";
import type { DensityRegionKey } from "@/services/types";

const REGION_ORDER: DensityRegionKey[] = ["ponto_inicial", "meio", "cauda"];

const pointInPolygon = (point: { x: number; y: number }, polygon: Array<{ x: number; y: number }>) => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 1) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};

const toPolygon = (bbox: RegionBBox) => bbox.points.map((point) => ({ x: point.x, y: point.y }));

export const detectDensityRegion = (
  densityBBox: RegionBBox | undefined,
  regionBBoxes: Partial<Record<DensityRegionKey, RegionBBox>> | undefined,
): DensityRegionKey[] => {
  if (!densityBBox || !regionBBoxes) {
    return [];
  }

  console.log("[detectDensityRegion] primeiros 3 pontos do densityBBox.points:", densityBBox.points.slice(0, 3));
  console.log(
    "[detectDensityRegion] primeiros 3 pontos dos polígonos das regiões:",
    Object.entries(regionBBoxes).map(([regionKey, bbox]) => ({
      region: regionKey,
      points: bbox.points.slice(0, 3),
    })),
  );

  const densityPoints = densityBBox.points;
  if (densityPoints.length === 0) {
    return [];
  }

  const regionEntries = Object.entries(regionBBoxes) as Array<[DensityRegionKey, RegionBBox]>;
  if (regionEntries.length === 0) {
    return [];
  }

  const affectedRegions = REGION_ORDER.filter((regionKey) => {
    const bbox = regionBBoxes[regionKey];
    if (!bbox) {
      return false;
    }

    const polygon = toPolygon(bbox);
    const score = densityPoints.reduce(
      (count, point) => count + (pointInPolygon(point, polygon) ? 1 : 0),
      0,
    );

    return score > 0;
  });

  return affectedRegions;
};

export const formatDensityRegionLabel = (region: DensityRegionKey | null | undefined) => {
  if (!region) {
    return "não identificada";
  }

  const labels: Record<DensityRegionKey, string> = {
    ponto_inicial: "Início",
    meio: "Meio",
    cauda: "Cauda",
  };

  return labels[region];
};