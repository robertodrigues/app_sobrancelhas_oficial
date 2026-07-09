import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, X, MousePointer2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnalysisProcessingOverlay from '@/components/camera/AnalysisProcessingOverlay';

type Point = {
  x: number;
  y: number;
};

export interface RegionBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  points: Point[];
}

interface ImageAnnotatorProps {
  image: string;
  onSave: (annotatedImage: string, bboxes: Record<string, RegionBBox>) => Promise<void> | void;
  onCancel: () => void;
  mode?: 'single' | 'comparison' | 'tricoscopia';
  step?: 'regions' | 'density';
  regionsBBoxes?: Record<string, RegionBBox>;
}

type Region = 'ponto_inicial' | 'meio' | 'cauda' | 'falha' | 'ideal' | null;

type DrawingSnapshot = {
  data: string;
  bboxes: Record<string, RegionBBox>;
};


type RegionCentroidEntry = {
  key: string;
  centroid: Point;
};

type RegionProjectionEntry = RegionCentroidEntry & {
  projection: number;
};

const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({
  image,
  onSave,
  onCancel,
  mode = 'single',
  step = 'regions',
  regionsBBoxes,
}) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderRafRef = useRef<number | null>(null);
  const [activeRegion, setActiveRegion] = useState<Region>(null);
  const [brushSize, setBrushSize] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<DrawingSnapshot[]>([]);
  const [redoHistory, setRedoHistory] = useState<DrawingSnapshot[]>([]);
  const [currentBBoxes, setCurrentBBoxes] = useState<Record<string, RegionBBox>>({});
  const [isSaving, setIsSaving] = useState(false);
  const currentBBoxesRef = useRef<Record<string, RegionBBox>>({});
  const densityPolygonsRef = useRef<Record<'falha' | 'ideal', Point[]>>({ falha: [], ideal: [] });
  const imageRef = useRef<HTMLImageElement | null>(null);

  const colors: Record<string, string> = {
    ponto_inicial: '#16A34A',
    meio: '#EAB308',
    cauda: '#DC2626',
    falha: '#9B59B6',
    ideal: '#16A34A',
  };

  const footerLabels =
    mode === 'tricoscopia'
      ? {
          ponto_inicial: 'Pele',
          meio: 'Óstios',
          cauda: 'Fio',
        }
      : {
          ponto_inicial: 'Início',
          meio: 'Meio',
          cauda: 'Cauda',
        };

  const pointInPolygon = (point: Point, polygon: Point[]) => {
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

  const getRegionPolygon = (bbox: RegionBBox, width: number, height: number) =>
    bbox.points.map((point) => ({
      x: point.x * width,
      y: point.y * height,
    }));

  const getPolygonCentroid = (polygon: Point[]) => {
    const total = polygon.length || 1;
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

  const getDistanceBetweenPoints = (a: Point, b: Point) =>
    Math.hypot(b.x - a.x, b.y - a.y);

  const buildGeometricRegionOrder = (bboxes: Record<string, RegionBBox>) => {
    return Object.entries(bboxes)
      .filter(([, bbox]) => bbox.points.length >= 3)
      .map(([key, bbox]) => {
        const centroid = getPolygonCentroid(bbox.points);

        return {
          key,
          centroid,
        };
      });
  };

  const buildPrincipalAxisOrdering = (bboxes: Record<string, RegionBBox>) => {
    const entries = buildGeometricRegionOrder(bboxes);

    if (entries.length < 3) {
      return {
        entries: entries.map((entry) => ({ ...entry, projection: 0 })),
        axis: null,
      };
    }

    let farthestPair: {
      first: RegionCentroidEntry;
      second: RegionCentroidEntry;
      distance: number;
    } | null = null;

    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        const distance = getDistanceBetweenPoints(entries[i].centroid, entries[j].centroid);

        if (!farthestPair || distance > farthestPair.distance) {
          farthestPair = {
            first: entries[i],
            second: entries[j],
            distance,
          };
        }
      }
    }

    if (!farthestPair || farthestPair.distance <= 0) {
      return {
        entries: entries.map((entry) => ({
          ...entry,
          projection: entry.centroid.x,
        })),
        axis: null,
      };
    }

    const axisVector = {
      x: farthestPair.second.centroid.x - farthestPair.first.centroid.x,
      y: farthestPair.second.centroid.y - farthestPair.first.centroid.y,
    };

    const axisLength = Math.hypot(axisVector.x, axisVector.y) || 1;
    let axisUnit = {
      x: axisVector.x / axisLength,
      y: axisVector.y / axisLength,
    };

    if (axisUnit.x < 0) {
      axisUnit = {
        x: -axisUnit.x,
        y: -axisUnit.y,
      };
    }

    console.log('[buildPrincipalAxisOrdering] axisUnit final:', {
      x: axisUnit.x,
      y: axisUnit.y,
    });

    const projectedEntries: RegionProjectionEntry[] = entries.map((entry) => {
      const relative = {
        x: entry.centroid.x - farthestPair!.first.centroid.x,
        y: entry.centroid.y - farthestPair!.first.centroid.y,
      };

      return {
        ...entry,
        projection: relative.x * axisUnit.x + relative.y * axisUnit.y,
      };
    });

    return {
      entries: projectedEntries,
      axis: {
        first: farthestPair.first,
        second: farthestPair.second,
        unit: axisUnit,
        distance: farthestPair.distance,
      },
    };
  };

  const assignRegionLabelsBySide = (bboxes: Record<string, RegionBBox>, side: 'left' | 'right') => {
    const labelOrder = ['ponto_inicial', 'meio', 'cauda'] as const;
    const { entries, axis } = buildPrincipalAxisOrdering(bboxes);

    if (entries.length < 3) {
      return bboxes;
    }

    const sorted = [...entries].sort((a, b) =>
      side === 'left' ? b.projection - a.projection : a.projection - b.projection,
    );

    const mapped: Record<string, RegionBBox> = {};
    for (let i = 0; i < labelOrder.length; i += 1) {
      const entry = sorted[i];
      if (!entry) continue;
      mapped[labelOrder[i]] = bboxes[entry.key];
    }

    console.log('[assignRegionLabelsBySide] lado selecionado:', side);
    console.log('[assignRegionLabelsBySide] eixo principal:', axis || 'fallback-centroid.x');
    console.log(
      '[assignRegionLabelsBySide] projeções e centróides:',
      sorted.map((entry) => ({
        poligono: entry.key,
        centróide: entry.centroid,
        projeção: entry.projection,
      })),
    );
    console.log(
      '[assignRegionLabelsBySide] rótulos atribuídos:',
      labelOrder.map((label, index) => ({
        rotulo: label,
        poligono: sorted[index]?.key || null,
        centróide: sorted[index]?.centroid || null,
        projeção: sorted[index]?.projection ?? null,
      })),
    );

    return mapped;
  };

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;

      if (renderRafRef.current !== null) {
        window.cancelAnimationFrame(renderRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const img = new Image();
    if (image.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      imageRef.current = img;
      const canvas = mainCanvasRef.current;
      if (!canvas) return;

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const drawingCanvas = document.createElement('canvas');
      drawingCanvas.width = canvas.width;
      drawingCanvas.height = canvas.height;
      drawingCanvasRef.current = drawingCanvas;

      currentBBoxesRef.current = {};
      setCurrentBBoxes({});
      setHistory([{ data: drawingCanvas.toDataURL(), bboxes: {} }]);
      setRedoHistory([]);
      setActiveRegion(null);

      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };

    img.onerror = (err) => {
      console.error('Erro ao carregar imagem para anotação:', err);
    };

    img.src = image;
  }, [image]);

  useEffect(() => {
    if (!mainCanvasRef.current) return;

    const drawingCanvas = document.createElement('canvas');
    drawingCanvas.width = mainCanvasRef.current.width;
    drawingCanvas.height = mainCanvasRef.current.height;
    drawingCanvasRef.current = drawingCanvas;

    currentBBoxesRef.current = regionsBBoxes ? { ...regionsBBoxes } : {};
    setCurrentBBoxes(regionsBBoxes ? { ...regionsBBoxes } : {});
    setHistory([{ data: drawingCanvas.toDataURL(), bboxes: regionsBBoxes ? { ...regionsBBoxes } : {} }]);
    setRedoHistory([]);
    setActiveRegion(null);
    scheduleRender();

  }, [step, regionsBBoxes]);

  const getPolygonBounds = (polygon: Point[]) => {
    const xs = polygon.map((point) => point.x);
    const ys = polygon.map((point) => point.y);

    return {
      minX: Math.max(0, Math.floor(Math.min(...xs))),
      minY: Math.max(0, Math.floor(Math.min(...ys))),
      maxX: Math.max(0, Math.ceil(Math.max(...xs))),
      maxY: Math.max(0, Math.ceil(Math.max(...ys))),
    };
  };

  const render = () => {
    const canvas = mainCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    const img = imageRef.current;
    if (!canvas || !drawingCanvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.9;
    ctx.drawImage(drawingCanvas, 0, 0);
    ctx.globalAlpha = 1.0;
  };

  const scheduleRender = () => {
    if (renderRafRef.current !== null) return;

    renderRafRef.current = window.requestAnimationFrame(() => {
      renderRafRef.current = null;
      render();
    });
  };

  const updateBBox = (region: string, x: number, y: number) => {
    const canvas = mainCanvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const normalizedX = x / canvas.width;
    const normalizedY = y / canvas.height;
    const halfBrushX = (brushSize / canvas.width) / 2;
    const halfBrushY = (brushSize / canvas.height) / 2;

    const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

    setCurrentBBoxes((prev) => {
      const current =
        prev[region] || {
          minX: normalizedX,
          minY: normalizedY,
          maxX: normalizedX,
          maxY: normalizedY,
          points: [],
        };

      const nextPoint = { x: normalizedX, y: normalizedY };
      const nextPoints = [...current.points, nextPoint];

      const next = {
        ...prev,
        [region]: {
          minX: clamp01(Math.min(current.minX, normalizedX - halfBrushX)),
          minY: clamp01(Math.min(current.minY, normalizedY - halfBrushY)),
          maxX: clamp01(Math.max(current.maxX, normalizedX + halfBrushX)),
          maxY: clamp01(Math.max(current.maxY, normalizedY + halfBrushY)),
          points: nextPoints,
        },
      };

      currentBBoxesRef.current = next;
      return next;
    });
  };

  const getStrokeWidth = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return brushSize;

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;

    return brushSize * Math.max(scaleX, scaleY);
  };

  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeRegion || !drawingCanvasRef.current || isSaving) return;

    if ('preventDefault' in e) {
      e.preventDefault();
    }

    const position = getPointerPosition(e);
    if (!position) return;

    const dCtx = drawingCanvasRef.current.getContext('2d');
    if (dCtx) {
      dCtx.beginPath();
      dCtx.moveTo(position.x, position.y);
      dCtx.lineCap = 'round';
      dCtx.lineJoin = 'round';
      dCtx.strokeStyle = step === 'density' ? '#9B59B6' : colors[activeRegion];
      dCtx.globalAlpha = step === 'density' ? 0.92 : 1;
      dCtx.lineWidth = getStrokeWidth();
      dCtx.globalCompositeOperation = 'source-over';

      updateBBox(activeRegion, position.x, position.y);

      scheduleRender();
    }

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !drawingCanvasRef.current || !mainCanvasRef.current || !activeRegion || isSaving) return;

    if ('preventDefault' in e) {
      e.preventDefault();
    }

    const position = getPointerPosition(e);
    if (!position) return;

    const dCtx = drawingCanvasRef.current.getContext('2d');
    if (dCtx) {
      dCtx.strokeStyle = step === 'density' ? '#9B59B6' : colors[activeRegion];
      dCtx.globalAlpha = step === 'density' ? 0.92 : 1;
      dCtx.lineWidth = getStrokeWidth();
      dCtx.lineTo(position.x, position.y);
      dCtx.stroke();

      updateBBox(activeRegion, position.x, position.y);

      scheduleRender();
    }
  };

  const stopDrawing = () => {
    if (isSaving) return;

    if (isDrawing && drawingCanvasRef.current) {
      const snapshot: DrawingSnapshot = {
        data: drawingCanvasRef.current.toDataURL(),
        bboxes: { ...currentBBoxesRef.current },
      };

      setHistory((prev) => [...prev, snapshot]);
      setRedoHistory([]);
    }

    setIsDrawing(false);
    scheduleRender();
  };

  const restoreSnapshot = (snapshot: DrawingSnapshot) => {
    if (!drawingCanvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const dCtx = drawingCanvasRef.current?.getContext('2d');
      if (!dCtx || !drawingCanvasRef.current) return;

      dCtx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
      dCtx.drawImage(img, 0, 0);

      currentBBoxesRef.current = snapshot.bboxes;
      setCurrentBBoxes(snapshot.bboxes);
      scheduleRender();
    };
    img.src = snapshot.data;
  };

  const undo = () => {
    if (isSaving || history.length <= 1) return;

    const nextHistory = [...history];
    const currentSnapshot = nextHistory.pop();
    if (currentSnapshot) {
      setRedoHistory((prev) => [...prev, currentSnapshot]);
    }

    const previousSnapshot = nextHistory[nextHistory.length - 1];
    if (!previousSnapshot) return;

    setHistory(nextHistory);
    restoreSnapshot(previousSnapshot);
  };

  const redo = () => {
    if (isSaving || redoHistory.length === 0) return;

    const nextRedo = [...redoHistory];
    const snapshot = nextRedo.pop();
    if (!snapshot) return;

    setRedoHistory(nextRedo);
    setHistory((prev) => [...prev, snapshot]);
    restoreSnapshot(snapshot);
  };

  const calculateDensityMetrics = (): Record<string, number> => {
    const densities: Record<string, number> = {};
    const regions = ['ponto_inicial', 'meio', 'cauda'] as const;

    for (const region of regions) {
      densities[region] = 0;
    }

    return densities;
  };

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      if (step === 'density') {
        calculateDensityMetrics();
        await Promise.resolve(
          onSave(mainCanvasRef.current?.toDataURL('image/jpeg', 0.9) || image, currentBBoxesRef.current),
        );
      } else {
        const finalBBoxes = currentBBoxesRef.current;

        await Promise.resolve(
          onSave(mainCanvasRef.current?.toDataURL('image/jpeg', 0.9) || image, finalBBoxes),
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex h-full w-full max-h-full max-w-full flex-col overflow-hidden bg-[#1C3A2B] text-[#E8DECE]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#4A7A5C]/30 bg-[#1C3A2B] px-3 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] text-[#E8DECE] sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          disabled={isSaving}
          className="text-[#E8DECE] hover:bg-white/10 disabled:opacity-50"
        >
          <X size={24} />
        </Button>
        <div className="min-w-0 flex-1 px-2 text-center">
          <h2 className="truncate font-heading text-base font-normal text-[#E8DECE]">
            {step === 'density' ? 'Mapeamento de Densidade' : 'Mapeamento Técnico'}
          </h2>
          <p className="font-label-category text-[9px] text-[#8FAF8A]">
            {step === 'density'
              ? 'Pinte as áreas de falha e densidade ideal'
              : 'Circule as regiões'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          disabled={isSaving}
          className="h-9 w-auto rounded-full border border-[#FFB347]/40 bg-[radial-gradient(circle_at_30%_30%,#FFD089_0%,#FF9F1C_42%,#D97706_100%)] px-4 text-white shadow-[0_8px_18px_rgba(217,119,6,0.32),inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-5px_9px_rgba(120,53,15,0.28)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          aria-label="Confirmar marcação e avançar"
        >
          <span className="text-[12px] font-semibold tracking-[0.5px]">
            {step === 'density' ? 'Concluir' : 'Avançar'}
          </span>
        </Button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#1C3A2B]/90 px-2 py-2">
        <div className="relative flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-[#4A7A5C]/20 bg-[#10261C]">
          <canvas
            ref={mainCanvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="block h-auto w-auto max-h-full max-w-full touch-none cursor-crosshair"
            style={{
              touchAction: 'none',
              width: 'auto',
              height: 'auto',
            }}
          />

          {!activeRegion && !isSaving && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="max-w-xs rounded-3xl border border-[#4A7A5C] bg-[#1C3A2B]/90 p-6 text-center backdrop-blur-md">
                <MousePointer2 className="mx-auto mb-3 animate-bounce text-[#8FAF8A]" size={32} />
                <p className="font-heading text-base font-normal text-[#E8DECE]">Selecione uma cor abaixo</p>
                <p className="mt-1 font-body text-xs text-[#8FAF8A]">
                  {step === 'density'
                    ? 'e pinte as áreas correspondentes na sobrancelha'
                    : 'e circule a região correspondente na sobrancelha'}
                </p>
              </div>
            </div>
          )}

          {isSaving && (
            <AnalysisProcessingOverlay
              title="Aguarde..."
              message={
                step === 'density'
                  ? 'Estamos calculando as densidades e preparando a análise.'
                  : 'Estamos salvando suas marcações de região.'
              }
            />
          )}
        </div>
      </div>

      <div className="shrink-0 space-y-4 border-t border-[#4A7A5C]/30 bg-[#1C3A2B] px-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6">
        <div className="flex items-center justify-center gap-6 rounded-2xl border border-[#4A7A5C] bg-[#3D6B52]/50 p-3">
          <button
            onClick={() => setBrushSize(4)}
            disabled={isSaving}
            className={cn('rounded-full p-2 transition-all disabled:opacity-50', brushSize === 4 ? 'bg-[#16A34A] text-white' : 'text-[#8FAF8A]/70')}
          >
            <Circle size={8} fill="currentColor" />
          </button>
          <button
            onClick={() => setBrushSize(8)}
            disabled={isSaving}
            className={cn('rounded-full p-2 transition-all disabled:opacity-50', brushSize === 8 ? 'bg-[#EAB308] text-white' : 'text-[#8FAF8A]/70')}
          >
            <Circle size={14} fill="currentColor" />
          </button>
          <button
            onClick={() => setBrushSize(14)}
            disabled={isSaving}
            className={cn('rounded-full p-2 transition-all disabled:opacity-50', brushSize === 14 ? 'bg-[#DC2626] text-white' : 'text-[#8FAF8A]/70')}
          >
            <Circle size={20} fill="currentColor" />
          </button>
        </div>

        {step === 'density' ? (
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setActiveRegion('falha')}
              disabled={isSaving}
              className={cn(
                'flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all disabled:opacity-50',
                activeRegion === 'falha' ? 'border-[#9B59B6] bg-[#9B59B6]/20' : 'border-[#4A7A5C] bg-[#3D6B52]/30',
              )}
            >
              <div className="h-6 w-6 rounded-full bg-[#9B59B6]" />
              <span className="font-label-category text-[9px] text-[#E8DECE]">Falha / Rarefação</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setActiveRegion('ponto_inicial')}
              disabled={isSaving}
              className={cn(
                'flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all disabled:opacity-50',
                activeRegion === 'ponto_inicial' ? 'border-[#16A34A] bg-[#16A34A]/20' : 'border-[#4A7A5C] bg-[#3D6B52]/30',
              )}
            >
              <div className="h-6 w-6 rounded-full bg-[#16A34A]" />
              <span className="font-label-category text-[9px] text-[#E8DECE]">{footerLabels.ponto_inicial}</span>
            </button>

            <button
              onClick={() => setActiveRegion('meio')}
              disabled={isSaving}
              className={cn(
                'flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all disabled:opacity-50',
                activeRegion === 'meio' ? 'border-[#EAB308] bg-[#EAB308]/20' : 'border-[#4A7A5C] bg-[#3D6B52]/30',
              )}
            >
              <div className="h-6 w-6 rounded-full bg-[#EAB308]" />
              <span className="font-label-category text-[9px] text-[#E8DECE]">{footerLabels.meio}</span>
            </button>

            <button
              onClick={() => setActiveRegion('cauda')}
              disabled={isSaving}
              className={cn(
                'flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all disabled:opacity-50',
                activeRegion === 'cauda' ? 'border-[#DC2626] bg-[#DC2626]/20' : 'border-[#4A7A5C] bg-[#3D6B52]/30',
              )}
            >
              <div className="h-6 w-6 rounded-full bg-[#DC2626]" />
              <span className="font-label-category text-[9px] text-[#E8DECE]">{footerLabels.cauda}</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={undo}
            disabled={isSaving || history.length <= 1}
            className="h-14 w-full gap-2 border-[#D4C9B5] bg-[#F5F0E8] text-[#1C3A2B] shadow-sm hover:bg-[#E8DECE] active:bg-[#E8DECE] disabled:opacity-40"
          >
            <Undo2 size={18} />
            <span className="font-semibold">Desfazer</span>
          </Button>

          <Button
            variant="outline"
            onClick={redo}
            disabled={isSaving || redoHistory.length === 0}
            className="h-14 w-full gap-2 border-[#D4C9B5] bg-[#F5F0E8] text-[#1C3A2B] shadow-sm hover:bg-[#E8DECE] active:bg-[#E8DECE] disabled:opacity-40"
          >
            <Redo2 size={18} />
            <span className="font-semibold">Refazer</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageAnnotator;