"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { showError } from "@/utils/toast";
import type { AnalysisQuestionnaire } from "@/services/types";

interface QuestionnaireStepProps {
  onConfirm: (questionnaire: AnalysisQuestionnaire) => void;
  onCancel: () => void;
}

const QuestionnaireStep = ({ onConfirm, onCancel }: QuestionnaireStepProps) => {
  const [falha, setFalha] = useState<AnalysisQuestionnaire["falha"] | "">("");
  const [fiosEmCrescimento, setFiosEmCrescimento] = useState<
    AnalysisQuestionnaire["fiosEmCrescimento"] | ""
  >("");

  const handleConfirm = () => {
    if (!falha || !fiosEmCrescimento) {
      showError("Selecione as duas respostas do questionário.");
      return;
    }

    onConfirm({
      falha,
      fiosEmCrescimento,
    });
  };

  const optionButtonClass = (active: boolean) =>
    cn(
      "h-12 rounded-2xl border text-sm font-medium transition-all",
      active
        ? "border-[#8FAF8A] bg-[#1C3A2B] text-[#E8DECE] shadow-md"
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
                Responda exatamente as duas perguntas abaixo para concluir a marcação.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-[2px] text-[#8FAF8A]">
                  Falha
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFalha("Pontual")}
                    className={optionButtonClass(falha === "Pontual")}
                  >
                    Pontual
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFalha("Difusa")}
                    className={optionButtonClass(falha === "Difusa")}
                  >
                    Difusa
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-[2px] text-[#8FAF8A]">
                  Fios em crescimento
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFiosEmCrescimento("Sim")}
                    className={optionButtonClass(fiosEmCrescimento === "Sim")}
                  >
                    Sim
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFiosEmCrescimento("Não")}
                    className={optionButtonClass(fiosEmCrescimento === "Não")}
                  >
                    Não
                  </Button>
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

export default QuestionnaireStep;