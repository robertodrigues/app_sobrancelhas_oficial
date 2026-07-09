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
  comparisonVariant?: 'before' | 'after';
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
  comparisonVariant,
}) => {
  const dragStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState(false);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const gestureRef = useRef<{
    type: 'drag' | 'pinch' | null;
    startDistance: number;
    startScale: number;
    startX: number;
    startY: number;
    startCenter: { x: number; y: number } | null;
  }>({
    type: null,
    startDistance: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    startCenter: null,
  });
  const pendingValueRef = useRef({ x: 0, y: 0, scale: 1 });
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);

  const densityColor = comparisonVariant === 'after' ? '#2563EB' : '#9B59B6';
  const densityLabel = comparisonVariant === 'after' ? 'Evolução / Melhora' : 'Falha / Rarefação';
  const densityHint =
    comparisonVariant === 'after'
      ? 'Pinte de azul onde houve evolução'
      : 'Pinte de roxo onde existe falha';

  const colors: Record<string, string> = {
    ponto_inicial: '#16A34A',
    meio: '#EAB308',
    cauda: '#DC2626',
    falha: densityColor,
    ideal: '#16A34A',
  };

  const getTransformString = (transform: { x: number; y: number; scale: number }) =>
    `translate(-50%, -50%) translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`;

  const applyTransform = (transform: { x: number; y: number; scale: number }) => {
    const img = imgRef.current;
    if (!img) return;
    img.style.transform = getTransformString(transform);
  };

  const syncTransform = (transform: { x: number; y: number; scale: number }) => {
    pendingValueRef.current = transform;
    applyTransform(transform);
    onSave(displaySrc || image, regionsBBoxes || {});
  };

  const commitTransform = () => {
    onSave(displaySrc || image, regionsBBoxes || {});
  };

  useEffect(() => {
    applyTransform(pendingValueRef.current);
  }, [image]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const prepareDisplayImage = async () => {
      if (!image) {
        setDisplaySrc(null);
        return;
      }

      try {
        const img = new Image();
        if (image.startsWith('http')) {
          img.crossOrigin = 'anonymous';
        }

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
          img.src = image;
        });

        if (cancelled) return;

        setDisplaySrc(image);
      } catch {
        if (!cancelled) {
          setDisplaySrc(image);
        }
      }
    };

    prepareDisplayImage();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [image]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!image) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 1) {
      gestureRef.current = { ...gestureRef.current, type: 'drag' };
      dragStartRef.current = { x: event.clientX, y: event.clientY };
      setDragging(true);
      return;
    }

    if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      gestureRef.current = {
        type: 'pinch',
        startDistance: Math.hypot(second.x - first.x, second.y - first.y),
        startScale: pendingValueRef.current.scale,
        startX: pendingValueRef.current.x,
        startY: pendingValueRef.current.y,
        startCenter: {
          x: (first.x + second.x) / 2,
          y: (first.y + second.y) / 2,
        },
      };
      setDragging(true);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!image || !pointersRef.current.has(event.pointerId)) return;

    event.preventDefault();
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (gestureRef.current.type === 'pinch' && pointersRef.current.size >= 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      const currentDistance = Math.hypot(second.x - first.x, second.y - first.y);
      const currentCenter = {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      };
      const scaleRatio =
        gestureRef.current.startDistance > 0
          ? currentDistance / gestureRef.current.startDistance
          : 1;

      const nextScale = Math.min(3, Math.max(1, gestureRef.current.startScale * scaleRatio));
      const centerDelta = gestureRef.current.startCenter
        ? {
            x: currentCenter.x - gestureRef.current.startCenter.x,
            y: currentCenter.y - gestureRef.current.startCenter.y,
          }
        : { x: 0, y: 0 };

      const nextValue = {
        scale: nextScale,
        x: gestureRef.current.startX + centerDelta.x,
        y: gestureRef.current.startY + centerDelta.y,
      };

      syncTransform(nextValue);
      return;
    }

    if (gestureRef.current.type !== 'drag' || pointersRef.current.size > 1) return;

    const deltaX = event.clientX - dragStartRef.current.x;
    const deltaY = event.clientY - dragStartRef.current.y;

    dragStartRef.current = { x: event.clientX, y: event.clientY };

    const nextValue = {
      ...pendingValueRef.current,
      x: pendingValueRef.current.x + deltaX,
      y: pendingValueRef.current.y + deltaY,
    };

    syncTransform(nextValue);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);

    if (pointersRef.current.size === 0) {
      gestureRef.current = {
        type: null,
        startDistance: 0,
        startScale: pendingValueRef.current.scale,
        startX: pendingValueRef.current.x,
        startY: pendingValueRef.current.y,
        startCenter: null,
      };
      setDragging(false);
      commitTransform();
      return;
    }

    if (pointersRef.current.size === 1) {
      const [remainingPointer] = Array.from(pointersRef.current.values());
      gestureRef.current = {
        type: 'drag',
        startDistance: 0,
        startScale: pendingValueRef.current.scale,
        startX: pendingValueRef.current.x,
        startY: pendingValueRef.current.y,
        startCenter: null,
      };
      dragStartRef.current = { x: remainingPointer.x, y: remainingPointer.y };
      setDragging(true);
    }
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);

    if (pointersRef.current.size === 0) {
      gestureRef.current = {
        type: null,
        startDistance: 0,
        startScale: pendingValueRef.current.scale,
        startX: pendingValueRef.current.x,
        startY: pendingValueRef.current.y,
        startCenter: null,
      };
      setDragging(false);
      commitTransform();
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!image) return;
    event.preventDefault();

    const nextScale = Math.min(3, Math.max(1, pendingValueRef.current.scale - event.deltaY * 0.0015));
    const nextValue = { ...pendingValueRef.current, scale: nextScale };

    syncTransform(nextValue);
  };

  if (!image) {
    return (
      <div className="relative flex h-full w-full select-none items-center justify-center overflow-hidden bg-[#10261C] text-center">
        <div className="space-y-2 px-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#8FAF8A]">
            <Circle size={22} />
          </div>
          <p className="font-label-category text-[9px] text-[#E8DECE]">{comparisonVariant === 'after' ? 'Depois' : 'Imagem'}</p>
          {step === 'regions' && <p className="font-body text-[10px] text-[#8FAF8A]">Envie uma foto para começar</p>}
        </div>
      </div>
    );
  }

  const shouldShowGuides = true;

  return (
    <div
      className={cn(
        "relative h-full w-full select-none overflow-hidden bg-[#10261C]",
        dragging ? "cursor-grabbing" : "cursor-grab",
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onWheel={handleWheel}
      style={{
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <img
        ref={imgRef}
        src={displaySrc || image}
        alt="Imagem anotada"
        draggable={false}
        className="absolute left-1/2 top-1/2 h-full w-full max-w-none max-h-none object-cover will-change-transform"
        style={{
          transform: getTransformString(pendingValueRef.current),
          transformOrigin: "center center",
          imageRendering: "auto",
          backfaceVisibility: "hidden",
        }}
      />

      {shouldShowGuides && (
        <>
          <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[9px] font-semibold uppercase tracking-[2px] text-white backdrop-blur-sm">
            {comparisonVariant === 'after' ? 'Depois' : 'Antes'}
          </div>

          <div className="absolute inset-0 border border-white/10" />
          <div className="absolute bottom-3 left-3 right-3 text-[10px] font-medium text-white/80">
            Arraste para reposicionar
          </div>
        </>
      )}

      {step === 'density' && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-black/10" />
          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[9px] font-semibold uppercase tracking-[2px] text-white backdrop-blur-sm">
            {densityLabel}
          </div>
          <div className="absolute bottom-16 left-0 right-0 px-4 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-[10px] font-medium text-white backdrop-blur-sm">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: densityColor }}
              />
              <span>{densityHint}</span>
            </div>
          </div>
        </>
      )}

      {step === 'density' && (
        <div className="absolute bottom-3 left-3 right-3 rounded-2xl border border-white/10 bg-black/35 p-3 backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setDragging(false)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white"
            >
              <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: densityColor }} />
              {densityLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnnotator;