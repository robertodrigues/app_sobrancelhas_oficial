import type { RegionBBox } from "@/components/camera/ImageAnnotator";
import type { DensityRegionKey } from "@/services/types";

const REGION_LABELS: Record<DensityRegionKey, string> = {
  ponto_inicial: "Início",
  meio: "Meio",
  cauda: "Cauda",
};

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

const getPolygonCentroid = (polygon: Array<{ x: number; y: number }>) => {
  if (polygon.length === 0) {
    return { x: 0.5, y: 0.5 };
  }

  const total = polygon.length;
  const sum = polygon.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: sum.x / total,
    y: sum.y / total,
  };
};

const toPolygon = (bbox: RegionBBox) => bbox.points.map((point) => ({ x: point.x, y: point.y }));

export const detectDensityRegion = (
  densityBBox: RegionBBox | undefined,
  regionBBoxes: Partial<Record<DensityRegionKey, RegionBBox>> | undefined,
): DensityRegionKey | null => {
  if (!densityBBox || !regionBBoxes) {
    return null;
  }

  const densityPoints = densityBBox.points;
  if (densityPoints.length === 0) {
    return null;
  }

  const regionEntries = Object.entries(regionBBoxes) as Array<[DensityRegionKey, RegionBBox]>;
  if (regionEntries.length === 0) {
    return null;
  }

  let bestRegion: DensityRegionKey | null = null;
  let bestScore = -1;

  for (const [regionKey, bbox] of regionEntries) {
    const polygon = toPolygon(bbox);
    const score = densityPoints.reduce((count, point) => count + (pointInPolygon(point, polygon) ? 1 : 0), 0);

    if (score > bestScore) {
      bestScore = score;
      bestRegion = regionKey;
    }
  }

  if (bestRegion && bestScore > 0) {
    return bestRegion;
  }

  const densityCentroid = getPolygonCentroid(densityPoints);
  let closestRegion: DensityRegionKey | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const [regionKey, bbox] of regionEntries) {
    const centroid = getPolygonCentroid(toPolygon(bbox));
    const distance = Math.hypot(centroid.x - densityCentroid.x, centroid.y - densityCentroid.y);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestRegion = regionKey;
    }
  }

  return closestRegion;
};

export const formatDensityRegionLabel = (region: DensityRegionKey | null | undefined) => {
  if (!region) {
    return "não identificada";
  }

  return REGION_LABELS[region];
};