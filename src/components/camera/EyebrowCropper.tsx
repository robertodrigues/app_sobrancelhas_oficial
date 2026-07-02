import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Check, RotateCcw, X } from 'lucide-react';

interface EyebrowCropperProps {
  image: string;
  onConfirm: (croppedImage: string) => Promise<void> | void;
  onCancel: () => void;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const OUTPUT_SCALE = 2;

const EyebrowCropper: React.FC<EyebrowCropperProps> = ({ image, onConfirm, onCancel }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const gestureRef = useRef<{
    type: 'none' | 'drag' | 'pinch';
    startPointer: { x: number; y: number } | null;
    startOffset: { x: number; y: number };
    startScale: number;
    startDistance: number;
  }>({
    type: 'none',
    startPointer: null,
    startOffset: { x: 0, y: 0 },
    startScale: 1,
    startDistance: 0,
  });

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isConfirming, setIsConfirming] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const clampScale = (value: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));

  const getPoint = (event: React.PointerEvent | React.WheelEvent) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const updateStageSize = () => {
    const el = stageRef.current;
    if (!el) return;
    setStageSize({ width: el.clientWidth, height: el.clientHeight });
  };

  useEffect(() => {
    const img = new Image();
    if (image.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      imageRef.current = img;
      setLoadedImage(img);
      setIsReady(true);
    };

    img.onerror = () => {
      setIsReady(true);
    };

    img.src = image;
  }, [image]);

  useEffect(() => {
    updateStageSize();

    if (!stageRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }

    resizeObserverRef.current = new ResizeObserver(() => {
      updateStageSize();
    });

    resizeObserverRef.current.observe(stageRef.current);

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!loadedImage || stageSize.width === 0 || stageSize.height === 0) {
      return;
    }

    const fitScale = Math.min(stageSize.width / loadedImage.naturalWidth, stageSize.height / loadedImage.naturalHeight);
    const nextScale = clampScale(fitScale || 1);

    setScale(nextScale);
    setOffset({ x: 0, y: 0 });
  }, [loadedImage, stageSize.width, stageSize.height]);

  const resetPosition = () => {
    if (!loadedImage || stageSize.width === 0 || stageSize.height === 0) return;

    const fitScale = Math.min(stageSize.width / loadedImage.naturalWidth, stageSize.height / loadedImage.naturalHeight);
    setScale(clampScale(fitScale || 1));
    setOffset({ x: 0, y: 0 });
  };

  const applyZoomAtPoint = (nextScale: number, focusPoint: { x: number; y: number }, baseScale: number, baseOffset: { x: number; y: number }) => {
    const safeBaseScale = baseScale || 1;
    const scaleRatio = nextScale / safeBaseScale;
    const centerX = stageSize.width / 2;
    const centerY = stageSize.height / 2;

    setScale(nextScale);
    setOffset({
      x: baseOffset.x + (1 - scaleRatio) * (focusPoint.x - centerX - baseOffset.x),
      y: baseOffset.y + (1 - scaleRatio) * (focusPoint.y - centerY - baseOffset.y),
    });
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    if (!loadedImage) return;

    const focusPoint = getPoint(event);
    const zoomFactor = event.deltaY < 0 ? 1.08 : 0.92;
    const nextScale = clampScale(scale * zoomFactor);
    applyZoomAtPoint(nextScale, focusPoint, scale, offset);
  };

  const pointerDistance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const pointerMidpoint = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });

  const handlePointerDown = (event: React.PointerEvent) => {
    if (!loadedImage) return;
    const el = stageRef.current;
    if (!el) return;

    el.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, getPoint(event));

    const pointers = Array.from(pointersRef.current.values());
    if (pointers.length === 1) {
      gestureRef.current = {
        type: 'drag',
        startPointer: pointers[0],
        startOffset: offset,
        startScale: scale,
        startDistance: 0,
      };
    }

    if (pointers.length === 2) {
      gestureRef.current = {
        type: 'pinch',
        startPointer: pointerMidpoint(pointers[0], pointers[1]),
        startOffset: offset,
        startScale: scale,
        startDistance: pointerDistance(pointers[0], pointers[1]),
      };
    }
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!loadedImage) return;
    if (!pointersRef.current.has(event.pointerId)) return;

    pointersRef.current.set(event.pointerId, getPoint(event));
    const pointers = Array.from(pointersRef.current.values());
    const gesture = gestureRef.current;

    if (gesture.type === 'drag' && pointers.length === 1 && gesture.startPointer) {
      const current = pointers[0];
      setOffset({
        x: gesture.startOffset.x + (current.x - gesture.startPointer.x),
        y: gesture.startOffset.y + (current.y - gesture.startPointer.y),
      });
      return;
    }

    if (gesture.type === 'pinch' && pointers.length >= 2 && gesture.startDistance > 0) {
      const distance = pointerDistance(pointers[0], pointers[1]);
      const nextScale = clampScale(gesture.startScale * (distance / gesture.startDistance));
      const focusPoint = pointerMidpoint(pointers[0], pointers[1]);
      applyZoomAtPoint(nextScale, focusPoint, gesture.startScale, gesture.startOffset);
    }
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    const el = stageRef.current;
    if (el.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }

    pointersRef.current.delete(event.pointerId);
    const remaining = Array.from(pointersRef.current.values());

    if (remaining.length === 1) {
      gestureRef.current = {
        type: 'drag',
        startPointer: remaining[0],
        startOffset: offset,
        startScale: scale,
        startDistance: 0,
      };
      return;
    }

    gestureRef.current = {
      type: 'none',
      startPointer: null,
      startOffset: offset,
      startScale: scale,
      startDistance: 0,
    };
  };

  const cropCurrentView = async () => {
    if (!loadedImage || stageSize.width === 0 || stageSize.height === 0) return;

    const canvas = document.createElement('canvas');
    const outputScale = Math.max(2, Math.min(3, window.devicePixelRatio || 1));
    canvas.width = Math.round(stageSize.width * outputScale);
    canvas.height = Math.round(stageSize.height * outputScale);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Não foi possível preparar o recorte.');
    }

    ctx.fillStyle = '#0f1f16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderW = loadedImage.naturalWidth * scale;
    const renderH = loadedImage.naturalHeight * scale;
    const drawX = stageSize.width / 2 + offset.x - renderW / 2;
    const drawY = stageSize.height / 2 + offset.y - renderH / 2;
    const sourceX = (0 - drawX) / scale;
    const sourceY = (0 - drawY) / scale;
    const sourceW = stageSize.width / scale;
    const sourceH = stageSize.height / scale;

    ctx.drawImage(
      loadedImage,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      const cropped = await cropCurrentView();
      if (cropped) {
        await Promise.resolve(onConfirm(cropped));
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const displayW = loadedImage ? loadedImage.naturalWidth * scale : 0;
  const displayH = loadedImage ? loadedImage.naturalHeight * scale : 0;
  const imageX = stageSize.width / 2 + offset.x - displayW / 2;
  const imageY = stageSize.height / 2 + offset.y - displayH / 2;
  const guideCurve = useMemo(
    () =>
      'M 25 70 C 85 18, 155 18, 215 62 C 252 88, 286 96, 333 78',
    [],
  );

  return (
    <div className="absolute inset-0 z-50 flex h-full w-full flex-col overflow-hidden bg-[#1C3A2B] text-[#E8DECE]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#4A7A5C]/30 bg-[#1C3A2B] px-3 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-4">
        <Button variant="ghost" size="icon" onClick={onCancel} disabled={isConfirming} className="text-[#E8DECE] hover:bg-white/10">
          <X size={24} />
        </Button>
        <div className="min-w-0 flex-1 px-2 text-center">
          <h2 className="truncate font-heading text-base font-normal text-[#E8DECE]">Ajuste o enquadramento</h2>
          <p className="font-label-category text-[9px] text-[#8FAF8A]">Arraste e dê zoom para posicionar a sobrancelha na moldura</p>
        </div>
        <Button variant="ghost" size="icon" onClick={resetPosition} disabled={isConfirming} className="text-[#E8DECE] hover:bg-white/10">
          <RotateCcw size={20} />
        </Button>
      </div>

      <div className="flex-1 px-3 py-3 sm:px-4">
        <div
          ref={stageRef}
          className="relative h-full min-h-[62vh] overflow-hidden rounded-3xl border-2 border-dashed border-[#8FAF8A]/60 bg-[#10261C] touch-none"
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          {isReady && loadedImage ? (
            <>
              <img
                src={image}
                alt="Ajuste de enquadramento"
                draggable={false}
                className="absolute select-none"
                style={{
                  width: displayW,
                  height: displayH,
                  left: imageX,
                  top: imageY,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />

              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(15,31,22,0.08)_100%)]" />

              <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-6">
                <div className="mx-auto max-w-[440px]">
                  <svg viewBox="0 0 360 150" className="h-24 w-full opacity-90">
                    <path
                      d={guideCurve}
                      fill="none"
                      stroke="#FFD089"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="8 8"
                    />
                    <path
                      d="M 48 94 C 110 56, 176 56, 264 94"
                      fill="none"
                      stroke="#8FAF8A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="5 6"
                      opacity="0.9"
                    />
                  </svg>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-5">
                <div className="max-w-sm rounded-2xl border border-[#4A7A5C] bg-[#1C3A2B]/90 px-4 py-3 text-center backdrop-blur-md">
                  <p className="font-heading text-sm font-normal text-[#E8DECE]">Centralize a sobrancelha na moldura</p>
                  <p className="mt-1 text-[10px] text-[#8FAF8A]">A foto será recortada exatamente como estiver aqui</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <ArrowLeftRight className="mx-auto mb-3 text-[#8FAF8A]" size={32} />
                <p className="font-heading text-base font-normal">Carregando imagem...</p>
                <p className="mt-1 text-xs text-[#8FAF8A]">Prepare-se para ajustar o enquadramento.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#4A7A5C]/30 bg-[#1C3A2B] px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:px-4">
        <div className="mb-3 flex items-center justify-between gap-2 text-[10px] text-[#8FAF8A]">
          <span>Arraste para mover</span>
          <span>Scroll/pinch para zoom</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isConfirming} className="h-12 border-[#4A7A5C] bg-transparent text-[#E8DECE] hover:bg-white/10">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming || !loadedImage}
            className="h-12 rounded-xl border border-[#FFB347]/40 bg-[radial-gradient(circle_at_30%_30%,#FFD089_0%,#FF9F1C_42%,#D97706_100%)] text-white shadow-[0_8px_18px_rgba(217,119,6,0.32)]"
          >
            {isConfirming ? (
              'Recortando...'
            ) : (
              <>
                <Check size={16} className="mr-2" />
                Confirmar recorte
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EyebrowCropper;
