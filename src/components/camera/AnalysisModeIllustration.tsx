import React from "react";

type AnalysisMode = "single" | "comparison" | "tricoscopia";

interface AnalysisModeIllustrationProps {
  mode: AnalysisMode;
}

const AnalysisModeIllustration: React.FC<AnalysisModeIllustrationProps> = ({ mode }) => {
  if (mode === "comparison") {
    return (
      <div className="w-full max-w-xs rounded-3xl border border-dashed border-[#4A7A5C] bg-[#3D6B52]/30 px-5 py-7 text-center">
        <div className="mx-auto mb-4 flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full border border-[#8FAF8A]/40 bg-[#1C3A2B]/40 p-2 text-[#8FAF8A]">
              <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 40C18 30 27 24 39 24C46 24 52 26 56 30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <path d="M16 46C21 40 29 36 38 36C44 36 49 37 54 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
              </svg>
            </div>
            <span className="font-label-category text-[9px] text-[#8FAF8A]">Antes</span>
          </div>

          <div className="h-14 w-px bg-[#8FAF8A]/30" />

          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full border border-[#8FAF8A]/40 bg-[#1C3A2B]/40 p-2 text-[#E8DECE]">
              <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 40C18 30 27 24 39 24C46 24 52 26 56 30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <path d="M16 46C21 40 29 36 38 36C44 36 49 37 54 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-label-category text-[9px] text-[#8FAF8A]">Depois</span>
          </div>
        </div>

        <h3 className="font-heading text-base font-normal text-[#E8DECE]">Suba a foto para análise</h3>
        <p className="mt-2 font-body text-xs text-[#8FAF8A]">
          Use uma imagem com duas sobrancelhas para comparar o antes e o depois.
        </p>
      </div>
    );
  }

  if (mode === "tricoscopia") {
    return (
      <div className="w-full max-w-xs rounded-3xl border border-dashed border-[#4A7A5C] bg-[#3D6B52]/30 px-5 py-7 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#8FAF8A]/40 bg-[#1C3A2B]/40 text-[#8FAF8A]">
          <svg viewBox="0 0 80 80" className="h-11 w-11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="18" stroke="currentColor" strokeWidth="3" opacity="0.45" />
            <circle cx="40" cy="40" r="8" stroke="currentColor" strokeWidth="3" />
            <path d="M40 12V18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M40 62V68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M12 40H18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M62 40H68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M21 21L26 26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M54 54L59 59" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M59 21L54 26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M26 54L21 59" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <h3 className="font-heading text-base font-normal text-[#E8DECE]">Suba a foto para tricoscopia</h3>
        <p className="mt-2 font-body text-xs text-[#8FAF8A]">
          Use uma imagem aproximada dos pelos da sobrancelha, com visual de tricoscópio.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs rounded-3xl border border-dashed border-[#4A7A5C] bg-[#3D6B52]/30 px-5 py-7 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#8FAF8A]/40 bg-[#1C3A2B]/40 text-[#8FAF8A]">
        <svg viewBox="0 0 100 40" className="h-11 w-12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 26C22 16 36 12 50 14C63 16 76 20 90 28"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M14 30C24 24 36 22 49 23C61 24 72 27 86 33"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.65"
          />
        </svg>
      </div>

      <h3 className="font-heading text-base font-normal text-[#E8DECE]">Suba a foto para análise</h3>
      <p className="mt-2 font-body text-xs text-[#8FAF8A]">
        Use uma imagem da sobrancelha atual.
      </p>
    </div>
  );
};

export default AnalysisModeIllustration;