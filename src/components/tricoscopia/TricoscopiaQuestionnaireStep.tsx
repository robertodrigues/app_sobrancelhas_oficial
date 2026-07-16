"use client";

import React, { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { showError } from "@/utils/toast";
import type { TricoscopiaQuestionnaire, TricoscopiaRegionKey } from "@/services/types";

interface TricoscopiaQuestionnaireStepProps {
  region: TricoscopiaRegionKey;
  onConfirm: (questionnaire: TricoscopiaQuestionnaire) => void;
  onCancel: () => void;
}

const PELE_OPTIONS = [
  "vermelhidao",
  "descamacao_perifolicular",
  "descamacao_interfolicular",
  "oleosidade",
  "ressecamento",
  "sem_alteracoes",
] as const;

const OSTIOS_OPTIONS = [
  "ostio_sem_fio_visivel",
  "ostio_amarelo",
  "halo_perifolicular",
  "ostio_preto",
  "sem_alteracoes",
] as const;

const FIOS_OPTIONS = [
  "fios_espessura_diferente",
  "fios_miniaturizados",
  "fios_novos_nascendo",
  "fios_quebrados",
  "sem_alteracoes",
] as const;

const LABELS: Record<string, string> = {
  vermelhidao: "Vermelhidão",
  descamacao_perifolicular: "Descamação ao redor do óstio (perifolicular)",
  descamacao_interfolicular: "Descamação entre os óstios (interfolicular)",
  oleosidade: "Oleosidade",
  ressecamento: "Ressecamento",
  ostio_sem_fio_visivel: "Óstio sem fio visível",
  ostio_amarelo: "Óstio amarelo",
  halo_perifolicular: "Halo perifolicular (vermelhidão ao redor do óstio)",
  ostio_preto: "Óstio preto (fio quebrado junto à abertura folicular)",
  fios_espessura_diferente: "Fios de espessura diferente entre si",
  fios_miniaturizados: "Fios miniaturizados (mais finos que o habitual)",
  fios_novos_nascendo: "Fios novos nascendo",
  fios_quebrados: "Fios quebrados",
  sem_alteracoes: "Sem alterações",
};

const SECTION_TITLES = [
  { key: "pilarPele", title: "Pele", options: PELE_OPTIONS },
  { key: "pilarOstios", title: "Óstios", options: OSTIOS_OPTIONS },
  { key: "pilarFios", title: "Fios", options: FIOS_OPTIONS },
] as const;

const TricoscopiaQuestionnaireStep = ({ region, onConfirm, onCancel }: TricoscopiaQuestionnaireStepProps) => {
  const [pilarPele, setPilarPele] = useState<string[]>([]);
  const [pilarOstios, setPilarOstios] = useState<string[]>([]);
  const [pilarFios, setPilarFios] = useState<string[]>([]);

  const regionLabel = useMemo(
    () => (region === "ponto_inicial" ? "Início" : region === "meio" ? "Meio" : "Cauda"),
    [region],
  );

  const toggleOption = (
    current: string[],
    option: string,
    setValue: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setValue((prev) => {
      if (option === "sem_alteracoes") {
        return prev.includes("sem_alteracoes") ? [] : ["sem_alteracoes"];
      }

      const withoutNone = prev.filter((item) => item !== "sem_alteracoes");
      return withoutNone.includes(option)
        ? withoutNone.filter((item) => item !== option)
        : [...withoutNone, option];
    });
  };

  const renderSection = (
    title: string,
    options: readonly string[],
    selected: string[],
    onChange: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    const hasNone = selected.includes("sem_alteracoes");

    return (
      <div className="space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-[2px] text-[#8FAF8A]">{title}</p>
        <div className="space-y-2">
          {options.map((option) => {
            const active = selected.includes(option);

            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(selected, option, onChange)}
                disabled={option !== "sem_alteracoes" && hasNone}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                  active
                    ? "border-[#1C3A2B] bg-[#1C3A2B] text-[#E8DECE] shadow-md"
                    : "border-[#D4C9B5] bg-[#F5F0E8] text-[#1C3A2B] hover:bg-[#E8DECE]",
                  option !== "sem_alteracoes" && hasNone ? "opacity-50" : "",
                )}
              >
                <span className="text-sm font-medium leading-snug">{LABELS[option]}</span>
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
    );
  };

  const handleConfirm = () => {
    if (pilarPele.length === 0 || pilarOstios.length === 0 || pilarFios.length === 0) {
      showError("Selecione ao menos uma opção em cada pilar.");
      return;
    }

    onConfirm({
      regiao: region,
      pilarPele,
      pilarOstios,
      pilarFios,
    });
  };

  return (
    <div className="min-h-screen bg-[#1C3A2B] px-4 py-6 text-[#E8DECE]">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center justify-center">
        <Card className="w-full overflow-hidden rounded-3xl border border-[#4A7A5C]/40 bg-[#3D6B52]/35 shadow-xl">
          <CardContent className="space-y-6 p-5 sm:p-6">
            <div className="space-y-2 text-center">
              <p className="font-label-category text-[10px] text-[#8FAF8A]">Etapa 3</p>
              <h2 className="font-heading text-2xl font-normal text-[#E8DECE]">Questionário</h2>
              <p className="text-xs leading-relaxed text-[#D4C9B5]">
                Região analisada: {regionLabel}. Preencha os três pilares abaixo.
              </p>
            </div>

            {renderSection("Pele", PELE_OPTIONS, pilarPele, setPilarPele)}
            {renderSection("Óstios", OSTIOS_OPTIONS, pilarOstios, setPilarOstios)}
            {renderSection("Fios", FIOS_OPTIONS, pilarFios, setPilarFios)}

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
                className="h-12 rounded-2xl border border-[#FFB347]/40 bg-[radial-gradient(circle_at_30%_30%,#FFD089_0%,#FF9F1C_42%,#D97706_100%)] text-white shadow-[0_8px_18px_rgba(217,119,6,0.32)]"
              >
                <Check className="mr-2 h-4 w-4" />
                Gerar Análise
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TricoscopiaQuestionnaireStep;