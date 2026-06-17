import React from "react";
import { Loader2, Sparkles } from "lucide-react";

interface AnalysisProcessingOverlayProps {
  title?: string;
  message?: string;
}

const AnalysisProcessingOverlay = ({
  title = "Aguarde...",
  message = "Estamos preparando sua imagem para a próxima etapa.",
}: AnalysisProcessingOverlayProps) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#1C3A2B]/85 px-6 backdrop-blur-md">
      <div className="w-full max-w-xs rounded-[28px] border border-[#4A7A5C]/40 bg-[#10261C] px-6 py-7 text-center shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#8FAF8A]/30 bg-[#3D6B52]/40 text-[#8FAF8A]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>

        <h3 className="font-heading text-lg font-normal text-[#E8DECE]">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-[#8FAF8A]">{message}</p>

        <div className="mt-5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[2px] text-[#D4C9B5]">
          <Sparkles className="h-4 w-4 text-[#FFB347]" />
          Processando a marcação
        </div>
      </div>
    </div>
  );
};

export default AnalysisProcessingOverlay;