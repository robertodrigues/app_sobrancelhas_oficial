"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, AlertTriangle, Loader2, ShieldCheck, Target } from "lucide-react";
import jsPDF from "jspdf";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/lib/auth";
import { createUserStorageKey } from "@/lib/userStorage";
import { persistAnalysisRouteState } from "@/lib/analysisState";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";

type AnalysisPayload = {
  analysis?: any;
  image?: string;
  allImages?: Array<{ url?: string; dataUrl?: string; bboxes?: Record<string, unknown> }>;
};

const getSavedAnalysisState = (): AnalysisPayload | null => {
  try {
    const raw = sessionStorage.getItem("elha:last-analysis");
    return raw ? (JSON.parse(raw) as AnalysisPayload) : null;
  } catch {
    return null;
  }
};

const isRemoteImage = (src: string) => /^https?:\/\//i.test(src);

const getPdfSafeImageSrc = (src: string) => {
  if (!src) return src;
  if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("/")) return src;
  if (!isRemoteImage(src)) return src;
  const cleanUrl = src.replace(/^https?:\/\//, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
};

const fetchImageAsDataUrl = async (src: string) => {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error("Não foi possível carregar a imagem.");
  }

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Não foi possível converter a imagem."));
    reader.readAsDataURL(blob);
  });
};

const textValue = (value: unknown) => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.filter(Boolean).join(" • ");
  return "";
};

const AnalysisResult = () => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = (location.state as AnalysisPayload | null) || null;
  const savedState = getSavedAnalysisState();

  const analysis = routeState?.analysis ?? savedState?.analysis ?? null;
  const image = routeState?.image ?? savedState?.image ?? analysis?.image_url ?? null;
  const allImages = routeState?.allImages ?? savedState?.allImages ?? null;
  const reportRef = React.useRef<HTMLDivElement>(null);

  const [pdfLogo, setPdfLogo] = useState<string | null>(null);
  const [pdfBgColor, setPdfBgColor] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (routeState?.analysis || routeState?.image) {
      persistAnalysisRouteState({
        analysis: routeState.analysis,
        image: routeState.image || "",
        allImages: (routeState.allImages || []).map((item) => ({
          url: item.url || item.dataUrl || "",
          bboxes: item.bboxes,
        })),
      });
    }
  }, [routeState]);

  useEffect(() => {
    if (!user?.id) {
      setPdfLogo(null);
      setPdfBgColor(null);
      return;
    }

    const logoKey = createUserStorageKey(user.id, "pdf_custom_logo");
    const bgKey = createUserStorageKey(user.id, "pdf_custom_bg_color");

    const savedLogo = localStorage.getItem(logoKey) || localStorage.getItem("pdf_custom_logo");
    const savedBg = localStorage.getItem(bgKey) || localStorage.getItem("pdf_custom_bg_color");

    setPdfLogo(savedLogo);
    setPdfBgColor(savedBg);
  }, [user?.id]);

  const hasTwoImages = Array.isArray(allImages) && allImages.length >= 2;
  const isTricoscopia = analysis?.modoAnalise === "tricoscopia";

  const usesNewPromptShape = useMemo(
    () =>
      Boolean(
        analysis?.regiao_inicio ||
          analysis?.regiao_meio ||
          analysis?.regiao_cauda ||
          analysis?.avaliacao_geral,
      ),
    [analysis],
  );

  const displayBeforeImage = useMemo(
    () => (hasTwoImages ? allImages?.[0]?.dataUrl || allImages?.[0]?.url || "" : ""),
    [allImages, hasTwoImages],
  );

  const displayAfterImage = useMemo(
    () => (hasTwoImages ? allImages?.[1]?.dataUrl || allImages?.[1]?.url || "" : ""),
    [allImages, hasTwoImages],
  );

  const displaySingleImage = useMemo(() => {
    if (!Array.isArray(allImages) || allImages.length === 0) {
      return "";
    }

    const lastImage = allImages[allImages.length - 1];
    return lastImage?.dataUrl || lastImage?.url || "";
  }, [allImages]);

  const displayImage = useMemo(() => {
    if (hasTwoImages) {
      return displayAfterImage || displaySingleImage || image || analysis?.image_url || "";
    }

    return displaySingleImage || image || analysis?.image_url || "";
  }, [analysis?.image_url, displayAfterImage, displaySingleImage, hasTwoImages, image]);

  const titleText = analysis?.isComparativo
    ? "Relatório de Evolução"
    : isTricoscopia
      ? "Relatório Tricoscópico"
      : "Relatório Técnico";

  const getPdfImageData = async (src: string | null | undefined) => {
    if (!src) return "";
    const safeSrc = getPdfSafeImageSrc(src);
    if (safeSrc.startsWith("data:")) return safeSrc;
    return fetchImageAsDataUrl(safeSrc);
  };

  const hexToRgb = (hex: string) => {
    const normalized = hex.replace("#", "").trim();
    const value =
      normalized.length === 3
        ? normalized
            .split("")
            .map((char) => char + char)
            .join("")
        : normalized.padEnd(6, "0").slice(0, 6);

    return [
      Number.parseInt(value.slice(0, 2), 16) || 0,
      Number.parseInt(value.slice(2, 4), 16) || 0,
      Number.parseInt(value.slice(4, 6), 16) || 0,
    ] as const;
  };

  const handleGeneratePdf = async () => {
    if (!analysis) return;

    setIsGeneratingPdf(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      let cursorY = margin;

      const headerBgColor = pdfBgColor || "#F5F0E8";
      const [hr, hg, hb] = hexToRgb(headerBgColor);

      pdf.setFillColor(hr, hg, hb);
      pdf.rect(0, 0, pageWidth, 22, "F");

      if (pdfLogo) {
        const logoData = await getPdfImageData(pdfLogo);
        if (logoData) {
          const props = pdf.getImageProperties(logoData);
          const logoWidth = 34;
          const logoHeight = (props.height / props.width) * logoWidth;
          pdf.addImage(
            logoData,
            (props.fileType || "PNG").toUpperCase(),
            (pageWidth - logoWidth) / 2,
            4,
            logoWidth,
            logoHeight,
            undefined,
            "FAST",
          );
        }
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(28, 58, 43);
      pdf.text(titleText, pageWidth - margin, 9.5, { align: "right" });

      cursorY = 28;

      const ensureSpace = (neededHeight: number) => {
        if (cursorY + neededHeight > pageHeight - margin) {
          pdf.addPage();
          cursorY = margin;
        }
      };

      const addSectionTitle = (title: string) => {
        ensureSpace(10);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(28, 58, 43);
        pdf.text(title, margin, cursorY);
        cursorY += 7;
      };

      const addParagraph = (value: string, fontSize = 9.5) => {
        if (!value) return;
        const lines = pdf.splitTextToSize(value, contentWidth);
        const lineHeight = 4.5;
        ensureSpace(lines.length * lineHeight + 2);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(fontSize);
        pdf.setTextColor(28, 58, 43);
        pdf.text(lines, margin, cursorY);
        cursorY += lines.length * lineHeight + 2;
      };

      const addRegionBlock = (title: string, body: string, fillColor: string) => {
        ensureSpace(34);
        const [r, g, b] = hexToRgb(fillColor);
        const blockHeight = 24;

        pdf.setFillColor(r, g, b);
        pdf.roundedRect(margin, cursorY, contentWidth, blockHeight, 4, 4, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(28, 58, 43);
        pdf.text(title, margin + 4, cursorY + 7);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        const lines = pdf.splitTextToSize(body || "Sem conteúdo disponível.", contentWidth - 8);
        pdf.text(lines, margin + 4, cursorY + 13);

        cursorY += blockHeight + 5;
      };

      const addImageCard = async (
        label: string,
        src: string | null,
        x: number,
        y: number,
        width: number,
        height: number,
      ) => {
        const data = await getPdfImageData(src);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(28, 58, 43);
        pdf.text(label, x, y - 2);

        pdf.setFillColor(245, 240, 232);
        pdf.setDrawColor(212, 201, 181);
        pdf.roundedRect(x, y, width, height, 4, 4, "FD");

        if (data) {
          const props = pdf.getImageProperties(data);
          const aspect = props.width / props.height;

          let drawW = width - 4;
          let drawH = drawW / aspect;

          if (drawH > height - 4) {
            drawH = height - 4;
            drawW = drawH * aspect;
          }

          pdf.addImage(
            data,
            (props.fileType || "JPEG").toUpperCase(),
            x + (width - drawW) / 2,
            y + (height - drawH) / 2,
            drawW,
            drawH,
            undefined,
            "FAST",
          );
        }
      };

      if (analysis.isComparativo && hasTwoImages) {
        addSectionTitle("Imagens da análise");

        const boxWidth = (contentWidth - 6) / 2;
        const boxHeight = 68;
        ensureSpace(boxHeight + 16);

        await addImageCard("Antes", displayBeforeImage, margin, cursorY + 4, boxWidth, boxHeight);
        await addImageCard("Depois", displayAfterImage, margin + boxWidth + 6, cursorY + 4, boxWidth, boxHeight);
        cursorY += boxHeight + 12;
      } else {
        addSectionTitle("Imagem principal");

        const boxHeight = 120;
        ensureSpace(boxHeight + 10);

        pdf.setFillColor(245, 240, 232);
        pdf.setDrawColor(212, 201, 181);
        pdf.roundedRect(margin, cursorY, contentWidth, boxHeight, 6, 6, "FD");

        const imageData = await getPdfImageData(displayImage);
        if (imageData) {
          const props = pdf.getImageProperties(imageData);
          const aspect = props.width / props.height;

          let drawW = contentWidth - 4;
          let drawH = drawW / aspect;

          if (drawH > boxHeight - 4) {
            drawH = boxHeight - 4;
            drawW = drawH * aspect;
          }

          pdf.addImage(
            imageData,
            (props.fileType || "JPEG").toUpperCase(),
            margin + (contentWidth - drawW) / 2,
            cursorY + (boxHeight - drawH) / 2,
            drawW,
            drawH,
            undefined,
            "FAST",
          );
        }

        cursorY += boxHeight + 8;
      }

      if (usesNewPromptShape) {
        addSectionTitle("Resultado da análise");
        addRegionBlock("Início", textValue(analysis.regiao_inicio), "#EAF3DE");
        addRegionBlock("Meio", textValue(analysis.regiao_meio), "#FEF3C7");
        addRegionBlock("Cauda", textValue(analysis.regiao_cauda), "#FEE2E2");

        ensureSpace(10);
        pdf.setFillColor(232, 222, 206);
        pdf.roundedRect(margin, cursorY, contentWidth, 24, 4, 4, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(28, 58, 43);
        pdf.text("Avaliação geral", margin + 4, cursorY + 7);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        const summaryLines = pdf.splitTextToSize(textValue(analysis.avaliacao_geral) || "Sem conteúdo disponível.", contentWidth - 8);
        pdf.text(summaryLines, margin + 4, cursorY + 13);
      } else if (isTricoscopia) {
        addSectionTitle("Relatório tricoscópico");
        addParagraph(textValue(analysis.regiaoAnalisada), 10);

        if (analysis.analiseDaPele?.conclusao) {
          addSectionTitle("Análise da pele");
          addParagraph(textValue(analysis.analiseDaPele.conclusao), 9.5);
        }

        if (analysis.analiseDosFios?.classificacaoFiosPresentes) {
          addSectionTitle("Análise dos fios");
          addParagraph(textValue(analysis.analiseDosFios.classificacaoFiosPresentes), 9.5);
        }

        if (analysis.analiseDosOstiosFoliculares?.ostioComFio) {
          addSectionTitle("Óstios foliculares");
          addParagraph(textValue(analysis.analiseDosOstiosFoliculares.ostioComFio), 9.5);
        }

        if (analysis.conclusaoTricoscopica?.estadoGeral) {
          addSectionTitle("Conclusão");
          addParagraph(textValue(analysis.conclusaoTricoscopica.estadoGeral), 9.5);
        }
      } else {
        addSectionTitle("Resumo");
        addParagraph(textValue(analysis?.avaliacao_geral || analysis?.visaoGeral?.descricao || ""), 10);
      }

      pdf.save(`relatorio-diagnostico-${analysis.isComparativo ? "evolucao" : "tecnico"}.pdf`);
      showSuccess("Relatório PDF gerado com sucesso!");
    } catch (error) {
      console.error(error);
      showError("Erro ao gerar o PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] text-[#1C3A2B]">
        <div className="text-center p-6">
          <p className="mb-4 font-body text-sm text-[#4A7A5C]">Nenhuma análise encontrada.</p>
          <Button onClick={() => navigate("/")} className="btn-elha-primary px-6 h-11">
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pt-20 transition-colors duration-300 text-[#1C3A2B] bg-[#F5F0E8]">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <header className="relative flex flex-col items-center justify-center mb-8 text-center pt-4">
          <button
            onClick={() => navigate("/")}
            className="absolute left-0 p-2 hover:bg-[#E8DECE] rounded-full transition-colors text-[#1C3A2B]"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-heading text-2xl font-normal text-[#1C3A2B]">{titleText}</h1>
            <p className="font-label-category text-[10px] text-[#4A7A5C] mt-0.5">Análise Inteligente</p>
          </div>
        </header>

        <div ref={reportRef} className="space-y-6 p-4 rounded-3xl">
          {analysis.isComparativo && hasTwoImages ? (
            <div className="flex flex-row justify-between gap-4 w-full">
              <div className="w-[48%] space-y-2">
                <p className="font-label-category text-[10px] text-[#4A7A5C] text-center">Antes</p>
                <div className="rounded-2xl shadow-md border-2 border-[#E8DECE] p-1 bg-[#1C3A2B]/5">
                  <img
                    src={displayBeforeImage}
                    className="w-full aspect-square rounded-[12px] object-contain bg-[#F5F0E8] block"
                    alt="Antes"
                  />
                </div>
              </div>
              <div className="w-[48%] space-y-2">
                <p className="font-label-category text-[10px] text-[#4A7A5C] text-center">Depois</p>
                <div className="rounded-2xl shadow-md border-2 border-[#4A7A5C] p-1 bg-[#1C3A2B]/5">
                  <img
                    src={displayAfterImage}
                    className="w-full aspect-square rounded-[12px] object-contain bg-[#F5F0E8] block"
                    alt="Depois"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-3xl shadow-lg border-4 border-[#E8DECE] p-2 bg-[#1C3A2B]/5 min-h-[280px] flex items-center justify-center overflow-hidden">
                {displayImage ? (
                  <img
                    src={displayImage}
                    className="w-full aspect-square rounded-[20px] object-contain bg-[#F5F0E8] block"
                    alt="Análise"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-[20px] bg-[#F5F0E8] border border-dashed border-[#D4C9B5] flex flex-col items-center justify-center text-center px-6">
                    <p className="font-heading text-lg text-[#1C3A2B]">Foto indisponível</p>
                    <p className="mt-2 text-xs text-[#4A7A5C]">
                      A imagem não carregou no relatório, mas o diagnóstico continua disponível abaixo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {usesNewPromptShape ? (
            <section className="space-y-4">
              <h2 className="font-label-category text-xs font-medium text-[#1C3A2B] flex items-center gap-2">
                <Target size={18} className="text-[#4A7A5C]" />
                Resultado da análise
              </h2>

              <div className="grid gap-4">
                <Card className="border-none shadow-sm rounded-2xl overflow-hidden" style={{ backgroundColor: "#EAF3DE" }}>
                  <CardContent className="p-6 space-y-2">
                    <p className="text-[10px] uppercase tracking-[3px] text-[#166534]">Início</p>
                    <p className="font-heading text-lg font-medium text-[#14532D]">
                      {textValue(analysis.regiao_inicio) || "Sem conteúdo disponível."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-2xl overflow-hidden" style={{ backgroundColor: "#FEF3C7" }}>
                  <CardContent className="p-6 space-y-2">
                    <p className="text-[10px] uppercase tracking-[3px] text-[#A16207]">Meio</p>
                    <p className="font-heading text-lg font-medium text-[#78350F]">
                      {textValue(analysis.regiao_meio) || "Sem conteúdo disponível."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-2xl overflow-hidden" style={{ backgroundColor: "#FEE2E2" }}>
                  <CardContent className="p-6 space-y-2">
                    <p className="text-[10px] uppercase tracking-[3px] text-[#991B1B]">Cauda</p>
                    <p className="font-heading text-lg font-medium text-[#7F1D1D]">
                      {textValue(analysis.regiao_cauda) || "Sem conteúdo disponível."}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border border-[#D4C9B5] bg-[#E8DECE] rounded-3xl">
                <CardHeader>
                  <CardTitle className="font-label-category text-[10px] text-[#1C3A2B] flex items-center gap-2">
                    <ShieldCheck className="text-[#4A7A5C]" size={18} />
                    Avaliação geral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-body text-sm text-[#1C3A2B]/90 leading-relaxed">
                    {textValue(analysis.avaliacao_geral) || "Sem conteúdo disponível."}
                  </p>
                </CardContent>
              </Card>
            </section>
          ) : isTricoscopia ? (
            <section className="space-y-4">
              <h2 className="font-label-category text-xs font-medium text-[#1C3A2B] flex items-center gap-2">
                <Target size={18} className="text-[#4A7A5C]" />
                Relatório tricoscópico
              </h2>

              <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-[#1C3A2B] text-[#E8DECE]">
                <CardContent className="p-6 space-y-4">
                  <p className="font-heading text-base font-normal">
                    {textValue(analysis.regiaoAnalisada) || "Análise sem região informada."}
                  </p>
                  <p className="text-xs text-[#E8DECE]/90">
                    {textValue(analysis.analiseDaPele?.conclusao) || "Sem conteúdo disponível."}
                  </p>
                  <p className="text-xs text-[#E8DECE]/90">
                    {textValue(analysis.analiseDosFios?.classificacaoFiosPresentes) || "Sem conteúdo disponível."}
                  </p>
                  <p className="text-xs text-[#E8DECE]/90">
                    {textValue(analysis.conclusaoTricoscopica?.estadoGeral) || "Sem conteúdo disponível."}
                  </p>
                </CardContent>
              </Card>
            </section>
          ) : (
            <Card className="border border-[#D4C9B5] bg-[#E8DECE] rounded-3xl">
              <CardHeader>
                <CardTitle className="font-label-category text-[10px] text-[#1C3A2B] flex items-center gap-2">
                  <ShieldCheck className="text-[#4A7A5C]" size={18} />
                  Resumo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-body text-sm text-[#1C3A2B]/90 leading-relaxed">
                  {textValue(analysis?.avaliacao_geral || analysis?.visaoGeral?.descricao) || "Sem conteúdo disponível."}
                </p>
              </CardContent>
            </Card>
          )}

          {analysis.alertaInterno?.presente && !usesNewPromptShape && (
            <div className="bg-[#EAF3DE] border border-[#8FAF8A] p-4 rounded-2xl flex gap-3 items-start">
              <AlertTriangle className="text-[#3B6D11] shrink-0" size={18} />
              <div>
                <p className="font-label-category text-[10px] text-[#3B6D11]">Alerta de Fator Interno</p>
                <p className="font-body text-xs text-[#3B6D11] mt-0.5">{analysis.alertaInterno.descricao}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 px-4">
          <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf} className="btn-elha-primary w-full h-14">
            {isGeneratingPdf ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download size={14} className="mr-1.5" /> Gerar Relatório PDF
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AnalysisResult;