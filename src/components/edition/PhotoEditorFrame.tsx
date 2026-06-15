import React, { useRef, useState } from "react";
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
}

const MIN_SCALE = 1;
const MAX_SCALE = 3;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const PhotoEditorFrame = ({ src, label, value, onChange }: PhotoEditorFrameProps) => {
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!src) return;
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !src) return;

    const deltaX = event.clientX - dragStartRef.current.x;
    const deltaY = event.clientY - dragStartRef.current.y;

    dragStartRef.current = { x: event.clientX, y: event.clientY };

    onChange({
      ...value,
      x: value.x + deltaX,
      y: value.y + deltaY,
    });
  };

  const stopDragging = () => setDragging(false);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!src) return;
    event.preventDefault();

    const nextScale = clamp(value.scale - event.deltaY * 0.0015, MIN_SCALE, MAX_SCALE);
    onChange({ ...value, scale: nextScale });
  };

  if (!src) {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#10261C] text-center select-none">
        <div className="space-y-2 px-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#8FAF8A]">
            <ImageIcon size={22} />
          </div>
          <p className="font-label-category text-[9px] text-[#E8DECE]">{label}</p>
          <p className="font-body text-[10px] text-[#8FAF8A]">Envie uma foto para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-[#10261C] select-none touch-none",
        dragging ? "cursor-grabbing" : "cursor-grab",
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onPointerLeave={stopDragging}
      onWheel={handleWheel}
      style={{ touchAction: "none" }}
    >
      <img
        src={src}
        alt={label}
        draggable={false}
        className="absolute left-1/2 top-1/2 h-full w-full max-w-none max-h-none object-cover"
        style={{
          transform: `translate(-50%, -50%) translate(${value.x}px, ${value.y}px) scale(${value.scale})`,
          transformOrigin: "center center",
        }}
      />

      <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[9px] font-semibold uppercase tracking-[2px] text-white backdrop-blur-sm">
        {label}
      </div>

      <div className="absolute inset-0 border border-white/10" />
      <div className="absolute bottom-3 left-3 right-3 text-[10px] font-medium text-white/80">
        Arraste para reposicionar
      </div>
    </div>
  );
};

export default PhotoEditorFrame;