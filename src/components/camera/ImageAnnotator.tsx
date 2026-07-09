"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type Point = { x: number; y: number };

export type RegionBBox = {
  points: Point[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type Region = "falha" | "ideal" | "evolucao";

type ImageAnnotatorMode = "single" | "comparison" | "tricoscopia";
type ImageAnnotatorStep = "regions" | "density";

interface ImageAnnotatorProps {
  image: string;
  mode: ImageAnnotatorMode;
  step: ImageAnnotatorStep;
  regionsBBoxes?: Record<string, RegionBBox>;
  onSave: (annotatedImage: string, bboxes: Record<string, RegionBBox>) => void;
  onCancel: () => void;
}

export const colors: Record<Region, string> = {
  falha: "#9B59B6",
  ideal: "#16A34A",
  evolucao: "#2563EB",
};

export const calculateDensityMetrics = (bboxes: Partial<Record<Region, RegionBBox>>) => {
  return {
    falha: bboxes.falha ?? null,
    ideal: bboxes.ideal ?? null,
  };
};

const ImageAnnotator = ({
  image,
  mode,
  step,
  regionsBBoxes,
  onSave,
  onCancel,
}: ImageAnnotatorProps) => {
  const [activeRegion, setActiveRegion] = useState<Region>("falha");

  const densityButtons = useMemo(
    () => (
      <div className={cn("grid gap-3", mode === "comparison" ? "grid-cols-3" : "grid-cols-2")}>
        <button
          onClick={() => setActiveRegion("falha")}
          className={cn(
            "flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all disabled:opacity-50",
            activeRegion === "falha"
              ? "border-[#9B59B6] bg-[#9B59B6]/20"
              : "border-[#4A7A5C] bg-[#3D6B52]/30",
          )}
        >
          <div className="h-6 w-6 rounded-full bg-[#9B59B6]" />
          <span className="font-label-category text-[9px] text-[#E8DECE]">Falha / Rarefação</span>
        </button>

        <button
          onClick={() => setActiveRegion("ideal")}
          className={cn(
            "flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all disabled:opacity-50",
            activeRegion === "ideal"
              ? "border-[#16A34A] bg-[#16A34A]/20"
              : "border-[#4A7A5C] bg-[#3D6B52]/30",
          )}
        >
          <div className="h-6 w-6 rounded-full bg-[#16A34A]" />
          <span className="font-label-category text-[9px] text-[#E8DECE]">Densidade Ideal</span>
        </button>

        {mode === "comparison" && (
          <button
            onClick={() => setActiveRegion("evolucao")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all disabled:opacity-50",
              activeRegion === "evolucao"
                ? "border-[#2563EB] bg-[#2563EB]/20"
                : "border-[#4A7A5C] bg-[#3D6B52]/30",
            )}
          >
            <div className="h-6 w-6 rounded-full bg-[#2563EB]" />
            <span className="font-label-category text-[9px] text-[#E8DECE]">Evolução</span>
          </button>
        )}
      </div>
    ),
    [activeRegion, mode],
  );

  const handleSave = () => {
    const nextBboxes = regionsBBoxes || {};
    onSave(image, nextBboxes);
  };

  return (
    <div className="min-h-screen bg-[#1C3A2B] px-4 py-4 text-[#E8DECE]">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <div className="flex items-center justify-between rounded-2xl border border-[#4A7A5C]/40 bg-[#3D6B52]/35 px-3 py-3">
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-[#E8DECE] hover:bg-white/10">
            <X size={20} />
          </Button>

          <div className="text-center">
            <p className="font-label-category text-[10px] text-[#8FAF8A]">
              {step === "density" ? "Etapa de densidade" : "Etapa de regiões"}
            </p>
            <h2 className="font-heading text-base font-normal text-[#E8DECE]">
              {mode === "comparison" ? "Modo comparação" : "Modo análise"}
            </h2>
          </div>

          <Button variant="ghost" size="icon" onClick={handleSave} className="text-[#E8DECE] hover:bg-white/10">
            <Save size={18} />
          </Button>
        </div>

        <Card className="overflow-hidden rounded-3xl border border-[#4A7A5C]/40 bg-[#10261C] shadow-xl">
          <CardContent className="p-0">
            <div className="relative aspect-square w-full overflow-hidden bg-[#10261C]">
              {image ? (
                <img src={image} alt="Imagem para anotação" className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-center">
                  <div className="space-y-2 px-6">
                    <p className="font-heading text-base text-[#E8DECE]">Nenhuma imagem carregada</p>
                    <p className="text-xs text-[#8FAF8A]">Escolha uma imagem para continuar.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {step === "density" ? (
          <Card className="overflow-hidden rounded-3xl border border-[#4A7A5C]/40 bg-[#3D6B52]/35 shadow-xl">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center gap-2 text-[#8FAF8A]">
                <ArrowLeft size={16} />
                <span className="font-label-category text-[9px] tracking-[2px]">Selecione a camada</span>
              </div>
              {densityButtons}
              <div className="flex items-center justify-between rounded-2xl border border-[#4A7A5C]/30 bg-[#1C3A2B]/40 px-4 py-3">
                <span className="text-xs text-[#D4C9B5]">Camada ativa</span>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-[#E8DECE]">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: colors[activeRegion] }}
                  />
                  {activeRegion === "falha"
                    ? "Falha / Rarefação"
                    : activeRegion === "ideal"
                      ? "Densidade Ideal"
                      : "Evolução"}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-3xl border border-[#4A7A5C]/40 bg-[#3D6B52]/35 shadow-xl">
            <CardContent className="space-y-4 p-4">
              <div className="rounded-2xl border border-dashed border-[#8FAF8A]/40 bg-[#1C3A2B]/30 p-4 text-center">
                <p className="font-heading text-sm text-[#E8DECE]">Etapa de regiões</p>
                <p className="mt-1 text-xs text-[#D4C9B5]">
                  Esta tela agora está com JSX válido novamente.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-12 border-[#4A7A5C] bg-transparent text-[#E8DECE] hover:bg-white/10"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="h-12 rounded-xl border border-[#FFB347]/40 bg-[radial-gradient(circle_at_30%_30%,#FFD089_0%,#FF9F1C_42%,#D97706_100%)] text-white shadow-[0_8px_18px_rgba(217,119,6,0.32)]"
          >
            <Check size={16} className="mr-2" />
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageAnnotator;