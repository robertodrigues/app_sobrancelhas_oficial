"use client";

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ImageAnnotator, { type RegionBBox } from "@/components/camera/ImageAnnotator";
import QuestionnaireStep from "@/components/camera/QuestionnaireStep";
import ComparisonQuestionnaireStep from "@/components/camera/ComparisonQuestionnaireStep";
import type { AnalysisMode, AnalysisQuestionnaire, DensityRegionKey } from "@/services/types";
import { detectDensityRegion } from "@/lib/densityRegion";

type TechnicalMappingState = {
  image?: string;
  bboxes?: Record<string, RegionBBox>;
  step?: "regions" | "density" | "questionnaire";
  densityRegion?: DensityRegionKey[];
  densityBBoxes?: Record<string, RegionBBox>;
  analysisMode?: AnalysisMode;
  comparisonVariant?: "before" | "after";
};

const TechnicalMapping = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<TechnicalMappingState | null>(null);

  useEffect(() => {
    const routeState = location.state as TechnicalMappingState | null;

    if (routeState?.image) {
      setState({
        ...routeState,
        step: routeState.step || "regions",
        analysisMode: routeState.analysisMode || "single",
      });
      return;
    }

    navigate("/captura", { replace: true });
  }, [location.state, navigate]);

  const handleSave = (annotatedImage: string, bboxes: Record<string, RegionBBox>) => {
    if (!state?.image) return;

    if (state.step === "regions") {
      setState((current) => ({
        ...current,
        image: annotatedImage,
        bboxes,
        step: "density",
      }));
      return;
    }

    if (state.step === "density") {
      const densityBBox = bboxes.falha;
      const densityRegion = detectDensityRegion(densityBBox, state.bboxes || {});
      const densityBBoxes = densityBBox ? { falha: densityBBox } : {};

      setState((current) => ({
        ...current,
        image: annotatedImage,
        bboxes: state.bboxes || {},
        step: "questionnaire",
        densityRegion,
        densityBBoxes,
      }));
    }
  };

  const handleComparisonQuestionnaireConfirm = (questionnaire: AnalysisQuestionnaire) => {
    if (!state?.image) return;

    navigate("/captura", {
      replace: true,
      state: {
        image: state.image,
        bboxes: state.bboxes || {},
        comparisonQuestionnaire: questionnaire,
        densityRegion: state.densityRegion || [],
        densityBBoxes: state.densityBBoxes || {},
      },
    });
  };

  const handleQuestionnaireConfirm = (questionnaire: AnalysisQuestionnaire) => {
    if (!state?.image) return;

    navigate("/captura", {
      replace: true,
      state: {
        image: state.image,
        bboxes: state.bboxes || {},
        questionnaire,
        densityRegion: state.densityRegion || [],
        densityBBoxes: state.densityBBoxes || {},
      },
    });
  };

  const handleCancel = () => {
    navigate("/captura", { replace: true });
  };

  if (!state?.image) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1C3A2B] px-6 text-center text-[#E8DECE]">
        <div className="space-y-3">
          <p className="font-heading text-lg font-normal">Carregando mapeamento técnico...</p>
          <p className="text-xs text-[#8FAF8A]">Aguarde um instante.</p>
        </div>
      </div>
    );
  }

  if (state.step === "questionnaire") {
    if (state.analysisMode === "comparison") {
      return (
        <ComparisonQuestionnaireStep
          onConfirm={handleComparisonQuestionnaireConfirm}
          onCancel={handleCancel}
        />
      );
    }

    return (
      <QuestionnaireStep
        onConfirm={handleQuestionnaireConfirm}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <ImageAnnotator
      image={state.image}
      mode={state.analysisMode === "comparison" ? "comparison" : "single"}
      step={state.step || "regions"}
      regionsBBoxes={state.bboxes}
      comparisonVariant={state.comparisonVariant}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default TechnicalMapping;