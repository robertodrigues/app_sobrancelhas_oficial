"use client";

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2, Upload, User } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { showError, showSuccess } from "@/utils/toast";
import { performDualAnalysis } from "@/services/analysis";
import { consumeAnalysisCredit } from "@/services/credits";
import { buildSingleImageState, persistAnalysisRouteState } from "@/lib/analysisState";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/auth";
import { useSupabaseClient } from "@/lib/supabase";
import AnalysisModeIllustration from "@/components/camera/AnalysisModeIllustration";
import type { RegionBBox } from "@/components/camera/ImageAnnotator";
import type { AnalysisImage, TricoscopiaQuestionnaire, TricoscopiaRegionKey } from "@/services/types";
import TricoscopiaAnnotationStep from "@/components/tricoscopia/TricoscopiaAnnotationStep";
import TricoscopiaQuestionnaireStep from "@/components/tricoscopia/TricoscopiaQuestionnaireStep";

const REGION_OPTIONS: Array<{ key: TricoscopiaRegionKey; label: string }> = [
  { key: "ponto_inicial", label: "Início" },
  { key: "meio", label: "Meio" },
  { key: "cauda", label: "Cauda" },
];

const Tricoscopia = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const supabase = useSupabaseClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<TricoscopiaRegionKey | null>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [annotatedBboxes, setAnnotatedBboxes] = useState<Record<string, RegionBBox>>({});
  const [questionnaire, setQuestionnaire] = useState<TricoscopiaQuestionnaire | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const regionLabel = selectedRegion === "ponto_inicial" ? "Início" : selectedRegion === "meio" ? "Meio" : "Cauda";

  useEffect(() => {
    const fetchClients = async () => {
      setClients([]);

      if (!user?.id) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from("clients")
          .select("id, name")
          .eq("user_id", user.id)
          .order("name");

        if (error) {
          throw error;
        }

        setClients(data || []);
      } catch (err) {
        console.error("Erro ao buscar clientes:", err);
        showError("Erro ao buscar clientes.");
      }
    };

    fetchClients();
  }, [user?.id, supabase]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      setRawImage(result);
      setAnnotatedImage(null);
      setAnnotatedBboxes({});
      setQuestionnaire(null);
      setStep(1);
      setSelectedRegion(null);
      showSuccess("Imagem carregada com sucesso!");
    };
    reader.onerror = () => {
      showError("Não foi possível carregar a imagem.");
    };
    reader.readAsDataURL(file);
  };

  const handleProceedToMarking = () => {
    if (!rawImage || !selectedRegion) {
      showError("Selecione a imagem e a região correspondente.");
      return;
    }

    if (!selectedClientId) {
      showError("Selecione um cliente para salvar a análise no histórico.");
      return;
    }

    setStep(2);
  };

  const handleConfirmAnnotation = (markedImage: string, bboxes: Record<string, RegionBBox>) => {
    setAnnotatedImage(markedImage);
    setAnnotatedBboxes(bboxes);
    setStep(3);
  };

  const handleFinish = async (nextQuestionnaire: TricoscopiaQuestionnaire) => {
    if (!user?.id) {
      showError("Sessão inválida. Faça login novamente.");
      return;
    }

    if (!selectedClientId) {
      showError("Selecione um cliente para salvar a análise no histórico.");
      return;
    }

    const finalImage = annotatedImage || rawImage;
    if (!finalImage || !selectedRegion) {
      showError("Adicione a imagem e finalize as marcações antes de gerar a análise.");
      return;
    }

    setQuestionnaire(nextQuestionnaire);
    setIsAnalyzing(true);

    try {
      await consumeAnalysisCredit(user.id);

      const analysisImage: AnalysisImage = {
        url: finalImage,
        dataUrl: finalImage,
        bboxes: annotatedBboxes,
        tricoscopiaQuestionnaire: nextQuestionnaire,
      };

      const result = await performDualAnalysis([analysisImage], "tricoscopia");

      const routeState = buildSingleImageState(result, finalImage);
      persistAnalysisRouteState(routeState);

      const { error } = await supabase.from("analyses").insert([
        {
          client_id: selectedClientId,
          image_url: finalImage,
          result,
        },
      ]);

      if (error) {
        throw error;
      }

      showSuccess("Análise de tricoscopia concluída!");
      navigate("/resultado", {
        replace: true,
        state: routeState,
      });
    } catch (error: any) {
      const message = String(error?.message || error || "");

      if (message.includes("Saldo insuficiente")) {
        showError("Saldo insuficiente. Vá em Créditos e recarregue para continuar.");
        setTimeout(() => {
          navigate("/creditos");
        }, 2000);
        return;
      }

      showError("Falha na análise: " + (error.message || "erro desconhecido"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (step === 2 && rawImage && selectedRegion) {
    return (
      <TricoscopiaAnnotationStep
        image={rawImage}
        regionLabel={regionLabel}
        onConfirm={handleConfirmAnnotation}
        onCancel={() => setStep(1)}
      />
    );
  }

  if (step === 3 && selectedRegion) {
    return (
      <TricoscopiaQuestionnaireStep
        region={selectedRegion}
        onConfirm={handleFinish}
        onCancel={() => setStep(2)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#1C3A2B] text-[#E8DECE] pb-28">
      <Navbar />

      <main className="mx-auto w-full max-w-md px-4 py-4 space-y-4">
        <header className="flex items-center justify-between gap-3 pt-2">
          <button onClick={handleCancel} className="rounded-full p-2 transition-colors hover:bg-white/10">
            <ArrowLeft size={20} />
          </button>

          <div className="text-center flex-1">
            <h1 className="font-heading text-lg font-normal">Tricoscopia</h1>
            <p className="mt-1 text-[10px] text-[#8FAF8A]">
              Imagem única por região, com marcação e questionário por pilares.
            </p>
          </div>

          <div className="w-9" />
        </header>

        <Card className="border border-[#4A7A5C]/40 bg-[#3D6B52]/35 text-[#E8DECE] rounded-2xl shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-[#8FAF8A]">
              <User size={16} />
              <span className="font-label-category text-[9px]">Selecionar Cliente</span>
            </div>

            <div className="rounded-xl border border-[#4A7A5C] bg-[#1C3A2B]/30 px-3 py-2.5">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-transparent text-[#E8DECE] outline-none text-xs"
              >
                <option value="" className="text-black">
                  Selecionar Cliente
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id} className="text-black">
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {clients.length === 0 && (
              <p className="text-[10px] text-[#8FAF8A]">
                Cadastre um cliente antes de gerar a análise.
              </p>
            )}

            <div className="grid grid-cols-3 gap-2">
              {REGION_OPTIONS.map((option) => {
                const active = selectedRegion === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedRegion(option.key)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-[10px] font-bold uppercase tracking-[2px] transition-all",
                      active
                        ? "border-[#8FAF8A] bg-[#4A7A5C] text-[#E8DECE] shadow-md"
                        : "border-[#4A7A5C] bg-[#1C3A2B]/25 text-[#8FAF8A] hover:bg-[#1C3A2B]/40",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#4A7A5C]/30 bg-[#1C3A2B]/70 text-[#E8DECE] rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-3">
            <div className="relative overflow-hidden rounded-xl border border-[#4A7A5C]/50 bg-[#10261C] min-h-[280px] flex items-center justify-center">
              {!rawImage ? (
                <div className="w-full flex items-center justify-center p-4 text-center">
                  <AnalysisModeIllustration mode="tricoscopia" />
                </div>
              ) : (
                <div className="relative w-full aspect-[3/4] max-h-[320px]">
                  <img src={rawImage} className="h-full w-full object-contain" alt="Imagem carregada" />
                  <div className="absolute inset-x-0 bottom-3 flex justify-center px-4 pointer-events-none">
                    <div className="pointer-events-auto rounded-xl border border-[#8FAF8A]/25 bg-[#4A7A5C]/90 px-3 py-2 text-center text-[#E8DECE] shadow-lg backdrop-blur-md">
                      <p className="text-[10px] font-bold">Imagem pronta</p>
                      <p className="mt-0.5 text-[8px] uppercase tracking-wider opacity-80">
                        Selecione a região e avance para marcar
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#D4C9B5] bg-[#E8DECE] text-[#1C3A2B] rounded-2xl shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="btn-elha-outline h-11 gap-1.5 text-xs"
              >
                <Upload size={14} />
                Upload
              </Button>

              <Button
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                className="btn-elha-outline h-11 gap-1.5 text-xs"
              >
                <Upload size={14} />
                Câmera
              </Button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            <Button
              className="btn-elha-primary w-full h-12 gap-2"
              onClick={handleProceedToMarking}
              disabled={!rawImage || !selectedRegion || isAnalyzing || !selectedClientId}
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
              Próximo
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Tricoscopia;