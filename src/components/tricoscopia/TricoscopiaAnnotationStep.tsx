"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RegionBBox } from "@/components/camera/ImageAnnotator";

type TricoscopiaCategory = "pele" | "ostios" | "fios";

interface TricoscopiaAnnotationStepProps {
  image: string;
  regionLabel: string;
  onConfirm: (annotatedImage: string, bboxes: Record<string, RegionBBox>) => void;
  onCancel: () => void;
}

const CATEGORIES: Array<{ key: TricoscopiaCategory; label: string; color: string }> = [
  { key: "pele", label: "Pele", color: "#F97316" },
  { key: "ostios", label: "Óstios", color: "#9CA3AF" },
  { key: "fios", label: "Fios", color: "#EC4899" },
];

const createEmptyBBox = (x: number, y: number) => ({
  minX: x,
  minY: y,
  maxX: x,
  maxY: y,
  points: [{ x, y }],
});

const TricoscopiaAnnotationStep = ({ image, regionLabel, onConfirm, onCancel }: TricoscopiaAnnotationStepProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drawingRef = useRef(false);
  const [activeCategory, setActiveCategory] = useState<TricoscopiaCategory>("pele");
  const [bboxes, setBboxes] = useState<Record<string, RegionBBox>>({});
  const [isLoading, setIsLoading] = useState(true);

  const activeColor = useMemo(
    () => CATEGORIES.find((item) => item.key === activeCategory)?.color || "#F97316",
    [activeCategory],
  );

  const drawBaseImage = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    let cancelled = false;
    const img = new Image();

    if (image.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }

    img.onload = () => {
      if (cancelled) return;

      imageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      setBboxes({});
      setIsLoading(false);
      drawBaseImage();
    };

    img.onerror = () => {
      if (!cancelled) setIsLoading(false);
    };

    img.src = image;

    return () => {
      cancelled = true;
    };
  }, [image]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const updateBBox = (category: TricoscopiaCategory, x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const normalizedX = x / canvas.width;
    const normalizedY = y / canvas.height;
    const halfBrush = 0.015;

    setBboxes((prev) => {
      const current = prev[category] || createEmptyBBox(normalizedX, normalizedY);
      const nextPoints = [...current.points, { x: normalizedX, y: normalizedY }];

      return {
        ...prev,
        [category]: {
          minX: Math.max(0, Math.min(current.minX, normalizedX - halfBrush)),
          minY: Math.max(0, Math.min(current.minY, normalizedY - halfBrush)),
          maxX: Math.min(1, Math.max(current.maxX, normalizedX + halfBrush)),
          maxY: Math.min(1, Math.max(current.maxY, normalizedY + halfBrush)),
          points: nextPoints,
        },
      };
    });
  };

  const paintStroke = (point: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = Math.max(8, Math.round(canvas.width * 0.01));
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (isLoading) return;
    const canvas = canvasRef.current;
    const point = getPoint(event);
    if (!canvas || !point) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    updateBBox(activeCategory, point.x, point.y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || isLoading) return;

    const point = getPoint(event);
    if (!point) return;

    event.preventDefault();
    paintStroke(point);
    updateBBox(activeCategory, point.x, point.y);
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
  };

  const handleClear = () => {
    setBboxes({});
    drawBaseImage();
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    onConfirm(canvas.toDataURL("image/jpeg", 0.95), bboxes);
  };

  return (
    <div className="min-h-screen bg-[#1C3A2B] px-4 py-6 text-[#E8DECE]">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center justify-center">
        <Card className="w-full overflow-hidden rounded-3xl border border-[#4A7A5C]/40 bg-[#3D6B52]/35 shadow-xl">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="space-y-2 text-center">
              <p className="font-label-category text-[10px] text-[#8FAF8A]">Etapa 2</p>
              <h2 className="font-heading text-2xl font-normal text-[#E8DECE]">Marcação da Tricoscopia</h2>
              <p className="text-xs leading-relaxed text-[#D4C9B5]">
                Região: {regionLabel}. Selecione uma categoria e desenhe diretamente sobre a imagem.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#4A7A5C]/30 bg-[#10261C] p-3">
              <canvas
                ref={canvasRef}
                className={cn("w-full rounded-[20px]", isLoading ? "opacity-60" : "opacity-100")}
                style={{ touchAction: "none" }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerLeave={handlePointerUp}
              />
              {isLoading && (
                <div className="mt-3 text-center text-xs text-[#8FAF8A]">Carregando imagem...</div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((category) => {
                const active = activeCategory === category.key;
                return (
                  <Button
                    key={category.key}
                    type="button"
                    onClick={() => setActiveCategory(category.key)}
                    className={cn(
                      "h-12 rounded-2xl border text-[10px] font-bold uppercase tracking-[2px]",
                      active
                        ? "border-white/20 text-white shadow-md"
                        : "border-[#4A7A5C] bg-transparent text-[#D4C9B5] hover:bg-white/10",
                    )}
                    style={active ? { backgroundColor: category.color } : undefined}
                  >
                    {category.label}
                  </Button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-[#4A7A5C]/30 bg-[#1C3A2B]/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[2px] text-[#8FAF8A]">Dica rápida</p>
              <p className="mt-1 text-xs text-[#E8DECE]/90">
                Use a cor laranja para pele, cinza para óstios e rosa para fios.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="h-12 rounded-2xl border-[#D4C9B5] bg-[#F5F0E8] text-[#1C3A2B] hover:bg-[#E8DECE]"
              >
                Voltar
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                className="h-12 rounded-2xl border border-[#FFB347]/40 bg-[radial-gradient(circle_at_30%_30%,#FFD089_0%,#FF9F1C_42%,#D97706_100%)] text-white shadow-[0_8px_18px_rgba(217,119,6,0.32)]"
                disabled={isLoading}
              >
                Confirmar
              </Button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#8FAF8A]">
              <button type="button" onClick={handleClear} className="underline underline-offset-4">
                Limpar marcações
              </button>
              <span>Cor ativa: {activeCategory}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TricoscopiaAnnotationStep;