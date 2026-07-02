"use client";

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ImageAnnotator, { type RegionBBox } from "@/components/camera/ImageAnnotator";

type TechnicalMappingState = {
  image?: string;
  bboxes?: Record<string, RegionBBox>;
};

const PENDING_ANALYSIS_KEY = "elha:pending-analysis";

const TechnicalMapping = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    const routeState = location.state as TechnicalMappingState | null;

    if (routeState?.image) {
      setImage(routeState.image);
      sessionStorage.setItem(PENDING_ANALYSIS_KEY, JSON.stringify(routeState));
      return;
    }

    const savedState = sessionStorage.getItem(PENDING_ANALYSIS_KEY);
    if (!savedState) {
      navigate("/captura", { replace: true });
      return;
    }

    const parsedState = JSON.parse(savedState) as TechnicalMappingState;
    if (!parsedState?.image) {
      navigate("/captura", { replace: true });
      return;
    }

    setImage(parsedState.image);
  }, [location.state, navigate]);

  const handleSave = (annotatedImage: string, bboxes: Record<string, RegionBBox>) => {
    const payload = {
      image: annotatedImage,
      bboxes,
    };

    sessionStorage.setItem(PENDING_ANALYSIS_KEY, JSON.stringify(payload));
    navigate("/captura", {
      replace: true,
      state: payload,
    });
  };

  const handleCancel = () => {
    sessionStorage.removeItem(PENDING_ANALYSIS_KEY);
    navigate("/captura", { replace: true });
  };

  if (!image) {
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
      image={image}
      mode="single"
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default TechnicalMapping;