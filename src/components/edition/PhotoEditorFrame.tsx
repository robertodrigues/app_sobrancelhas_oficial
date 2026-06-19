import React, { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PhotoTransform = {
  x: number;
  y: number;
  scale: number;
};

interface PhotoEditorFrameProps {
  src: string | null;
  label: string;
  value: PhotoTransform;
  onChange: (value: PhotoTransform) => void;
  showGuides?: boolean;
}

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const MAX_DISPLAY_DIMENSION = 1920;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const distanceBetween = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(b.x - a.x, b.y - a.y);

const centerBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
    if (src.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }
    img.src = src;
  });

const PhotoEditorFrame = ({
  src,
  label,
  value,
  onChange,
  showGuides = true,
}: PhotoEditorFrameProps) => {
  const dragStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState(false);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const gestureRef = useRef<{
    type: "drag" | "pinch" | null;
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
  const pendingValueRef = useRef(value);
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);

  const getTransformString = (transform: PhotoTransform) =>
    `translate(-50%, -50%) translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`;

  const applyTransform = (transform: PhotoTransform) => {
    const img = imgRef.current;
    if (!img) return;
    img.style.transform = getTransformString(transform);
  };

  const syncTransform = (transform: PhotoTransform) => {
    pendingValueRef.current = transform;
    applyTransform(transform);
    onChange(transform);
  };

  const commitTransform = () => {
    onChange(pendingValueRef.current);
  };

  useEffect(() => {
    pendingValueRef.current = value;
    applyTransform(value);
  }, [value, src]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const prepareDisplayImage = async () => {
      if (!src) {
        setDisplaySrc(null);
        return;
      }

      try {
        const img = await loadImage(src);

        if (cancelled) return;

        const needsResize =
          img.naturalWidth > MAX_DISPLAY_DIMENSION ||
          img.naturalHeight > MAX_DISPLAY_DIMENSION;

        if (!needsResize) {
          setDisplaySrc(src);
          return;
        }

        const scale = Math.min(
          MAX_DISPLAY_DIMENSION / img.naturalWidth,
          MAX_DISPLAY_DIMENSION / img.naturalHeight,
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setDisplaySrc(src);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/jpeg", 0.9);
        });

        if (cancelled) return;

        if (!blob) {
          setDisplaySrc(src);
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setDisplaySrc(objectUrl);
      } catch {
        if (!cancelled) {
          setDisplaySrc(src);
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
  }, [src]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!src) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 1) {
      gestureRef.current = { ...gestureRef.current, type: "drag" };
      dragStartRef.current = { x: event.clientX, y: event.clientY };
      setDragging(true);
      return;
    }

    if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      gestureRef.current = {
        type: "pinch",
        startDistance: distanceBetween(first, second),
        startScale: pendingValueRef.current.scale,
        startX: pendingValueRef.current.x,
        startY: pendingValueRef.current.y,
        startCenter: centerBetween(first, second),
      };
      setDragging(true);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!src || !pointersRef.current.has(event.pointerId)) return;

    event.preventDefault();
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (gestureRef.current.type === "pinch" && pointersRef.current.size >= 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      const currentDistance = distanceBetween(first, second);
      const currentCenter = centerBetween(first, second);
      const scaleRatio =
        gestureRef.current.startDistance > 0
          ? currentDistance / gestureRef.current.startDistance
          : 1;

      const nextScale = clamp(gestureRef.current.startScale * scaleRatio, MIN_SCALE, MAX_SCALE);
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

    if (gestureRef.current.type !== "drag" || pointersRef.current.size > 1) return;

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
        type: "drag",
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
    if (!src) return;
    event.preventDefault();

    const nextScale = clamp(pendingValueRef.current.scale - event.deltaY * 0.0015, MIN_SCALE, MAX_SCALE);
    const nextValue = { ...pendingValueRef.current, scale: nextScale };

    syncTransform(nextValue);
  };

  if (!src) {
    return (
      <div className="relative flex h-full w-full select-none items-center justify-center overflow-hidden bg-[#10261C] text-center">
        <div className="space-y-2 px-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#8FAF8A]">
            <ImageIcon size={22} />
          </div>
          <p className="font-label-category text-[9px] text-[#E8DECE]">{label}</p>
          {showGuides && (
            <p className="font-body text-[10px] text-[#8FAF8A]">Envie uma foto para começar</p>
          )}
        </div>
      </div>
    );
  }

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
        src={displaySrc || src}
        alt={label}
        draggable={false}
        className="absolute left-1/2 top-1/2 h-full w-full max-w-none max-h-none object-cover will-change-transform"
        style={{
          transform: getTransformString(value),
          transformOrigin: "center center",
          imageRendering: "auto",
          backfaceVisibility: "hidden",
        }}
      />

      {showGuides && (
        <>
          <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[9px] font-semibold uppercase tracking-[2px] text-white backdrop-blur-sm">
            {label}
          </div>

          <div className="absolute inset-0 border border-white/10" />
          <div className="absolute bottom-3 left-3 right-3 text-[10px] font-medium text-white/80">
            Arraste para reposicionar
          </div>
        </>
      )}
    </div>
  );
};

export default PhotoEditorFrame;