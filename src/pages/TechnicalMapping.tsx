"use client";

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ImageAnnotator, { type RegionBBox } from "@/components/camera/ImageAnnotator";

type TechnicalMappingState = {
  image?: string;
  bboxes?: Record<string, RegionBBox>;
  densities?: Record<string, number>;
  step?: "regions" | "density";
};

const TechnicalMapping = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<TechnicalMappingState | null>(null);

  useEffect(() => {
    const routeState = location.state as TechnicalMappingState | null;

    if (routeState?.image) {
      setState({ ...routeState, step: routeState.step || "regions" });
      return;
    }

    navigate("/captura", { replace: true });
  }, [location.state, navigate]);

  const handleSave = (
    annotatedImage: string,
    bboxes: Record<string, RegionBBox>,
    densities?: Record<string, number>,
  ) => {
    if (!state?.image) return;

    if (state.step === "regions") {
      setState({
        image: state.image,
        bboxes,
        step: "density",
      });
      return;
    }

    const payload = {
      image: annotatedImage,
      bboxes: state.bboxes || bboxes,
      densities,
      step: "density" as const,
    };

    navigate("/captura", {
      replace: true,
      state: payload,
    });
  };

  const handleCancel = () => {
    navigate("/captura", { replace: true });
  };

  if (!state?.image) {
    return (
      <div className="min-h-screen bg-[#1C3A2B] text-[#E8DECE] flex items-center justify-center px-6 text-center">
        <div className="space-y-3">
          <p className="font-heading text-lg font-normal">Carregando mapeamento técnico...</p>
          <p className="text-xs text-[#8FAF8A]">Aguarde um instante.</p>
        </div>
      </div>
    );
  }

  return (
    <ImageAnnotator
      image={state.image}
      mode="single"
      step={state.step || "regions"}
      regionsBBoxes={state.bboxes}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default TechnicalMapping;