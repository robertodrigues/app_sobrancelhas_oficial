"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { showError } from "@/utils/toast";
import type {
  AnalysisQuestionnaire,
  ComparisonEvolutionKey,
  DensityRegionKey,
  QuestionnaireAreaKey,
} from "@/services/types";

interface ComparisonQuestionnaireStepProps {
  onConfirm: (questionnaire: AnalysisQuestionnaire) => void;
  onCancel: () => void;
}

const REGION_OPTIONS: Array<{ key: DensityRegionKey; label: string; color: string }> = [
  { key: "ponto_inicial", label: "Início", color: "bg-[#16A34A]" },
  { key: "meio", label: "Meio", color: "bg-[#EAB308]" },
  { key: "cauda", label: "Cauda", color: "bg-[#DC2626]" },
];

const EVOLUTION_OPTIONS: Array<{ key: ComparisonEvolutionKey; label: string }> = [
  { key: "sem_evolucao", label: "Sem evolução" },
  { key: "discreta", label: "Discreta" },
  { key: "moderada", label: "Moderada" },
  { key: "evidente", label: "Evidente" },
  { key: "piora", label: "Piora" },
];

const FEATURE_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "encorpamento", label: "Melhora no encorpamento dos fios" },
  { key: "cobertura", label: "Melhora na cobertura visual" },
  { key: "uniformidade", label: "Maior uniformidade visual da sobrancelha" },
];

const ComparisonQuestionnaireStep = ({ onConfirm, onCancel }: ComparisonQuestionnaireStepProps) => {
  const [stageEvolution, setStageEvolution] = useState<Record<DensityRegionKey, ComparisonEvolutionKey | "">>({
    ponto_inicial: "",
    meio: "",
    cauda: "",
  });
  const [growthArea, setGrowthArea] = useState<QuestionnaireAreaKey[]>([]);
  const [features, setFeatures] = useState<string[]>([]);

  const toggleArea = (area: QuestionnaireAreaKey) => {
    setGrowthArea((current) => {
      if (area === "nenhuma") {
        return current.includes("nenhuma") ? [] : ["nenhuma"];
      }

      const withoutNone = current.filter((item) => item !== "nenhuma");
      return withoutNone.includes(area)
        ? withoutNone.filter((item) => item !== area)
        : [...withoutNone, area];
    });
  };

  const toggleFeature = (feature: string) => {
    setFeatures((current) =>
      current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature],
    );
  };

  const handleConfirm = () => {
    const allRegionsFilled = Object.values(stageEvolution).every(Boolean);

    if (!allRegionsFilled || growthArea.length === 0) {
      showError("Preencha todas as respostas da comparação.");
      return;
    }

    onConfirm({
      falha: "Pontual",
      fiosEmCrescimento: growthArea,
      comparisonEvolution: stageEvolution as Record<DensityRegionKey, ComparisonEvolutionKey>,
      growthArea,
      evolutionFeatures: features,
    });
  };

  const optionClass = (active: boolean) =>
    cn(
      "flex min-h-10 items-center justify-center rounded-full border px-2 py-2 text-center text-[9px] font-medium leading-none tracking-[-0.01em] transition-all sm:min-h-12 sm:text-[10px]",
      active
        ? "border-[#8FAF8A] bg-[#1C3A2B] text-[#E8DECE] shadow-md"
        : "border-[#D4C9B5] bg-[#F5F0E8] text-[#1C3A2B] hover:bg-[#E8DECE]",
    );

  const areaButtonClass = (active: boolean) =>
    cn(
      "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
      active
        ? "border-[#1C3A2B] bg-[#1C3A2B] text-[#E8DECE] shadow-md"
        : "border-[#D4C9B5] bg-[#F5F0E8] text-[#1C3A2B] hover:bg-[#E8DECE]",
    );

  return (
    <div className="min-h-screen bg-[#1C3A2B] px-4 py-6 text-[#E8DECE]">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center justify-center">
        <Card className="w-full overflow-hidden rounded-3xl border border-[#4A7A5C]/40 bg-[#3D6B52]/35 shadow-xl">
          <CardContent className="space-y-6 p-5 sm:p-6">
            <div className="space-y-2 text-center">
              <p className="font-label-category text-[10px] text-[#8FAF8A]">Etapa 3</p>
              <h2 className="font-heading text-2xl font-normal text-[#E8DECE]">Questionário</h2>
              <p className="text-xs leading-relaxed text-[#D4C9B5]">
                Preencha a evolução por região e a área de crescimento.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-[10px] font-medium uppercase tracking-[2px] text-[#8FAF8A]">
                  Tabela de evolução por região
                </p>

                <div className="space-y-3">
                  {REGION_OPTIONS.map((region) => (
                    <div
                      key={region.key}
                      className="space-y-3 rounded-2xl border border-[#D4C9B5] bg-[#F5F0E8] p-3 text-[#1C3A2B]"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn("h-3.5 w-3.5 rounded-full", region.color)} />
                        <span className="text-sm font-semibold">{region.label}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {EVOLUTION_OPTIONS.map((option) => {
                          const active = stageEvolution[region.key] === option.key;

                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() =>
                                setStageEvolution((current) => ({ ...current, [region.key]: option.key }))
                              }
                              className={optionClass(active)}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-[2px] text-[#8FAF8A]">
                  Área de crescimento e novos fios
                </p>

                <div className="space-y-2">
                  {REGION_OPTIONS.map((area) => {
                    const active = growthArea.includes(area.key);

                    return (
                      <button
                        key={area.key}
                        type="button"
                        onClick={() => toggleArea(area.key)}
                        className={areaButtonClass(active)}
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn("h-3.5 w-3.5 rounded-full", area.color)} />
                          <span className="text-sm font-medium">{area.label}</span>
                        </div>

                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-md border",
                            active
                              ? "border-[#8FAF8A] bg-[#E8DECE] text-[#1C3A2B]"
                              : "border-[#D4C9B5] bg-transparent text-transparent",
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => toggleArea("nenhuma")}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                      growthArea.includes("nenhuma")
                        ? "border-[#1C3A2B] bg-[#1C3A2B] text-[#E8DECE] shadow-md"
                        : "border-[#D4C9B5] bg-[#F5F0E8] text-[#1C3A2B] hover:bg-[#E8DECE]",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-3.5 w-3.5 rounded-full bg-[#8FAF8A]" />
                      <span className="text-sm font-medium">Nenhuma</span>
                    </div>

                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-md border",
                        growthArea.includes("nenhuma")
                          ? "border-[#8FAF8A] bg-[#E8DECE] text-[#1C3A2B]"
                          : "border-[#D4C9B5] bg-transparent text-transparent",
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-[2px] text-[#8FAF8A]">
                  Característica da evolução
                </p>

                <div className="space-y-2">
                  {FEATURE_OPTIONS.map((feature) => {
                    const active = features.includes(feature.key);

                    return (
                      <button
                        key={feature.key}
                        type="button"
                        onClick={() => toggleFeature(feature.key)}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                          active
                            ? "border-[#1C3A2B] bg-[#1C3A2B] text-[#E8DECE] shadow-md"
                            : "border-[#D4C9B5] bg-[#F5F0E8] text-[#1C3A2B] hover:bg-[#E8DECE]",
                        )}
                      >
                        <span className="text-sm font-medium leading-snug">{feature.label}</span>

                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-md border",
                            active
                              ? "border-[#8FAF8A] bg-[#E8DECE] text-[#1C3A2B]"
                              : "border-[#D4C9B5] bg-transparent text-transparent",
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
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
                className="h-12 rounded-2xl border border-[#FFB347]/40 bg-[radial-gradient(circle_at_30%_30%,#FFD089_0%,#FF9F1C_42%,#D97706_100%)] text-white shadow-[0_8px_18px_rgba(217,119,6,0.32),inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-5px_9px_rgba(120,53,15,0.28)] hover:bg-[radial-gradient(circle_at_30%_30%,#FFD089_0%,#FF9F1C_42%,#D97706_100%)]"
              >
                <Check className="mr-2 h-4 w-4" />
                Confirmar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComparisonQuestionnaireStep;