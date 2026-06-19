"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  AlertTriangle,
  Target,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Eye,
  MoveUpRight,
  Info,
  Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";
import { createUserStorageKey } from "@/lib/userStorage";
import { useUser } from "@/lib/auth";

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
  const reportRef = useRef<HTMLDivElement>(null);

  const [pdfLogo, setPdfLogo] = useState<string | null>(null);
  const [pdfBgColor, setPdfBgColor] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (routeState?.analysis || routeState?.image) {
      sessionStorage.setItem("elha:last-analysis", JSON.stringify(routeState));
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

  const displayBeforeImage = useMemo(
    () => (hasTwoImages ? allImages?.[0]?.dataUrl || allImages?.[0]?.url || "" : ""),
    [allImages, hasTwoImages],
  );

  const displayAfterImage = useMemo(
    () => (hasTwoImages ? allImages?.[1]?.dataUrl || allImages?.[1]?.url || "" : ""),
    [allImages, hasTwoImages],
  );

  const displayImage = useMemo(() => {
    if (hasTwoImages) {
      return displayAfterImage || image || analysis?.image_url || "";
    }
    return image || analysis?.image_url || "";
  }, [analysis?.image_url, displayAfterImage, hasTwoImages, image]);

  const regionEntries = Object.entries(analysis?.regioes || {});
  const isTricoscopia = analysis?.modoAnalise === "tricoscopia";

  const getRegionTheme = (key: string) => {
    switch (key) {
      case "inicio":
        return {
          label: "Ponto Inicial",
          labelColor: "#166534",
          valueColor: "#14532D",
          border: "#16A34A",
          bg: "#EAF3DE",
        };
      case "meio":
        return {
          label: "Meio da Sobrancelha",
          labelColor: "#A16207",
          valueColor: "#78350F",
          border: "#EAB308",
          bg: "#FEF3C7",
        };
      case "cauda":
        return {
          label: "Cauda da Sobrancelha",
          labelColor: "#991B1B",
          valueColor: "#7F1D1D",
          border: "#DC2626",
          bg: "#FEE2E2",
        };
      default:
        return {
          label: key,
          labelColor: "#1C3A2B",
          valueColor: "#1C3A2B",
          border: "#D4C9B5",
          bg: "#E8DECE",
        };
    }
  };

  const loadImageData = async (src: string | null | undefined) => {
    if (!src) return "";
    return fetchImageAsDataUrl(getPdfSafeImageSrc(src));
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

      const PDF_TEXT_COLOR = [0, 0, 0] as const;

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

      const getContrastingTextColor = (hex: string) => {
        const [r, g, b] = hexToRgb(hex);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.65 ? "#1C3A2B" : "#F5F0E8";
      };

      const customHeaderBg = pdfBgColor || "";
      const customHeaderLogo = pdfLogo ? await loadImageData(pdfLogo) : "";
      const hasCustomHeader = Boolean(customHeaderBg || customHeaderLogo);
      const headerHeight = hasCustomHeader ? 27 : 24;
      const headerBgColor = customHeaderBg || "#F5F0E8";
      const headerTextColor = getContrastingTextColor(headerBgColor);

      const renderHeader = () => {
        const [r, g, b] = hexToRgb(headerBgColor);
        pdf.setFillColor(r, g, b);
        pdf.rect(0, 0, pageWidth, headerHeight, "F");

        const title = analysis.isComparativo
          ? "Relatório de Evolução"
          : isTricoscopia
            ? "Relatório Tricoscópico"
            : "Relatório Técnico";

        if (customHeaderLogo) {
          const logoProps = pdf.getImageProperties(customHeaderLogo);
          const logoWidth = 31;
          const logoHeight = (logoProps.height / logoProps.width) * logoWidth;
          const logoX = (pageWidth - logoWidth) / 2;
          const logoY = 5;

          pdf.addImage(
            customHeaderLogo,
            (logoProps.fileType || "PNG").toUpperCase(),
            logoX,
            logoY,
            logoWidth,
            logoHeight,
            undefined,
            "FAST",
          );
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...hexToRgb(headerTextColor));
        pdf.text(title, pageWidth - margin, 12, { align: "right" });

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(...PDF_TEXT_COLOR);
        pdf.text("Análise Inteligente", pageWidth - margin, 18, { align: "right" });

        cursorY = headerHeight + 6;
      };

      const newPage = () => {
        pdf.addPage();
        renderHeader();
        addDivider();
      };

      const ensureSpace = (neededHeight: number) => {
        if (cursorY + neededHeight > pageHeight - margin) {
          newPage();
        }
      };

      const addSectionTitle = (title: string) => {
        ensureSpace(10);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(...PDF_TEXT_COLOR);
        pdf.text(title, margin, cursorY);
        cursorY += 8;
      };

      const addRegionTitleCard = (title: string, bgColor: string) => {
        ensureSpace(16);
        const cardHeight = 11;
        const [r, g, b] = hexToRgb(bgColor);

        pdf.setFillColor(r, g, b);
        pdf.setDrawColor(r, g, b);
        pdf.roundedRect(margin, cursorY, contentWidth, cardHeight, 4, 4, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(...PDF_TEXT_COLOR);
        pdf.text(title, margin + contentWidth / 2, cursorY + 7.3, { align: "center" });

        cursorY += cardHeight + 8;
      };

      const addParagraph = (text: string, fontSize = 9.5) => {
        if (!text) return;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...PDF_TEXT_COLOR);
        const lines = pdf.splitTextToSize(text, contentWidth);
        const height = lines.length * 4.3;
        ensureSpace(height);
        pdf.text(lines, margin, cursorY);
        cursorY += height + 2;
      };

      const addKeyValue = (label: string, value: unknown) => {
        const text = textValue(value);
        if (!text) return;

        ensureSpace(10);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9.5);
        pdf.setTextColor(...PDF_TEXT_COLOR);
        pdf.text(`${label}:`, margin, cursorY);
        cursorY += 5;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.2);
        pdf.setTextColor(...PDF_TEXT_COLOR);
        const lines = pdf.splitTextToSize(text, contentWidth);
        const height = lines.length * 4.2;
        ensureSpace(height);
        pdf.text(lines, margin, cursorY);
        cursorY += height + 3;
      };

      const addDivider = () => {
        ensureSpace(4);
        pdf.setDrawColor(212, 201, 181);
        pdf.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 4;
      };

      const addImageCard = async (
        label: string,
        src: string | null,
        x: number,
        y: number,
        width: number,
        height: number,
      ) => {
        const data = await loadImageData(src);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...PDF_TEXT_COLOR);
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

          const drawX = x + (width - drawW) / 2;
          const drawY = y + (height - drawH) / 2;

          pdf.addImage(
            data,
            (props.fileType || "JPEG").toUpperCase(),
            drawX,
            drawY,
            drawW,
            drawH,
            undefined,
            "FAST",
          );
        }
      };

      renderHeader();
      addDivider();

      if (analysis.isComparativo && hasTwoImages) {
        addSectionTitle("Imagens da análise");

        const boxWidth = (contentWidth - 6) / 2;
        const boxHeight = 68;
        ensureSpace(boxHeight + 20);

        const beforeData = await loadImageData(displayBeforeImage);
        const afterData = await loadImageData(displayAfterImage);
        const imageY = cursorY + 4;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...PDF_TEXT_COLOR);
        pdf.text("Antes", margin, cursorY);
        pdf.text("Depois", margin + boxWidth + 6, cursorY);

        await addImageCard("Antes", beforeData || displayBeforeImage || "", margin, imageY, boxWidth, boxHeight);
        await addImageCard(
          "Depois",
          afterData || displayAfterImage || "",
          margin + boxWidth + 6,
          imageY,
          boxWidth,
          boxHeight,
        );
        cursorY = imageY + boxHeight + 10;
      } else {
        addSectionTitle("Imagem principal");

        const boxHeight = 120;
        ensureSpace(boxHeight + 10);

        const imageData = await loadImageData(displayImage);
        pdf.setFillColor(245, 240, 232);
        pdf.setDrawColor(212, 201, 181);
        pdf.roundedRect(margin, cursorY, contentWidth, boxHeight, 6, 6, "FD");

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

        cursorY += boxHeight + 6;
      }

      if (analysis.isComparativo && analysis.comparativo) {
        cursorY += 12;
        addSectionTitle("Análise de evolução");
        addParagraph(analysis.comparativo.evolucaoGeral, 10);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(...PDF_TEXT_COLOR);
        pdf.text(`+${analysis.comparativo.melhoriaPercentualEstimada}% Melhoria`, margin, cursorY);
        cursorY += 6;

        addKeyValue("Destaque positivo", analysis.comparativo.destaquePositivo);
      }

      if (analysis.alertaInterno?.presente) {
        addSectionTitle("Alerta de fator interno");
        addParagraph(analysis.alertaInterno.descricao, 10);
      }

      if (isTricoscopia) {
        addSectionTitle("Região analisada");
        addParagraph(textValue(analysis.regiaoAnalisada), 10);

        addSectionTitle("Análise da pele");
        addKeyValue("Conclusão", analysis.analiseDaPele?.conclusao);
        addKeyValue("Descamação interfolicular", analysis.analiseDaPele?.descamacaoInterfolicular);
        addKeyValue("Descamação perifolicular", analysis.analiseDaPele?.descamacaoPerifolicular);
        addKeyValue("Coloração da descamação", analysis.analiseDaPele?.coloracaoDescamacao);
        addKeyValue("Sinais de procedimentos agressivos", analysis.analiseDaPele?.sinaisProcedimentosAgressivos);

        addSectionTitle("Análise dos fios");
        addKeyValue("Referência", analysis.analiseDosFios?.fioReferencia);
        addKeyValue("Classificação", analysis.analiseDosFios?.classificacaoFiosPresentes);
        addKeyValue("Pigmentação", analysis.analiseDosFios?.pigmentacao);
        addKeyValue("Quantidade e distribuição", analysis.analiseDosFios?.quantidadeDistribuicao);

        addSectionTitle("Óstios foliculares");
        addKeyValue("Óstio vazio", analysis.analiseDosOstiosFoliculares?.ostioVazio);
        addKeyValue("Óstio com fio", analysis.analiseDosOstiosFoliculares?.ostioComFio);
        addKeyValue("Presença de sebo", analysis.analiseDosOstiosFoliculares?.presencaSebo);
        addKeyValue("Atrofia ou cicatriz folicular", analysis.analiseDosOstiosFoliculares?.atrofiaOuCicatrizFolicular);

        addSectionTitle("Conclusão tricoscópica");
        addKeyValue("Estado geral", analysis.conclusaoTricoscopica?.estadoGeral);
        addKeyValue("Principais achados", analysis.conclusaoTricoscopica?.principaisAchados);
        addKeyValue("Indicadores positivos", analysis.conclusaoTricoscopica?.indicadoresPositivos);
        addKeyValue("Pontos de atenção", analysis.conclusaoTricoscopica?.pontosDeAtencao);
        addKeyValue("Correlação com a análise visual", analysis.conclusaoTricoscopica?.correlacaoAnaliseVisual);
      } else {
        for (const [key, data] of regionEntries as [string, any][]) {
          const labelMap: Record<string, string> = {
            inicio: "Ponto Inicial",
            meio: "Meio da Sobrancelha",
            cauda: "Cauda da Sobrancelha",
          };

          const theme = getRegionTheme(key);

          addRegionTitleCard(labelMap[key] || key, theme.bg);
          addKeyValue("Densidade", `${data.densidade?.classificacao || "Não informada"} (${data.densidade?.percentual ?? 0}%)`);
          addParagraph(data.descricao, 9.5);
          addKeyValue("Espessura", data.espessura);
          addKeyValue("Pele exposta", data.peleExposta ? "Sim" : "Não");
          addKeyValue("Exposição da pele", data.peleDescricao);
          addKeyValue("Direção dos fios", data.direcaoFios);
          addKeyValue("Características dos fios", data.caracteristicasEspeciais);
          addKeyValue("Prognóstico", data.prognostico);
          addKeyValue("Status de melhoria", data.statusMelhoria?.descricao);
          addDivider();
        }
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
            <h1 className="font-heading text-2xl font-normal text-[#1C3A2B]">
              {analysis.isComparativo ? "Relatório de Evolução" : isTricoscopia ? "Relatório Tricoscópico" : "Relatório Técnico"}
            </h1>
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

          {analysis.isComparativo && analysis.comparativo && (
            <Card className="border-none shadow-lg bg-[#1C3A2B] text-[#E8DECE] rounded-3xl overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-[#8FAF8A]" />
                    <h3 className="font-heading text-lg font-normal">Análise de Evolução</h3>
                  </div>
                  <div className="inline-flex rounded-full bg-[#EAF3DE] px-3 py-1 text-[10px] font-medium text-[#3B6D11]">
                    +{analysis.comparativo.melhoriaPercentualEstimada}% Melhoria
                  </div>
                </div>
                <p className="font-body text-xs text-[#E8DECE]/90 leading-relaxed">{analysis.comparativo.evolucaoGeral}</p>
                <div className="bg-white/10 p-3 rounded-xl flex items-start gap-2">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-[#8FAF8A]" />
                  <p className="font-body text-[11px] font-medium">Destaque: {analysis.comparativo.destaquePositivo}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.alertaInterno?.presente && (
            <div className="bg-[#EAF3DE] border border-[#8FAF8A] p-4 rounded-2xl flex gap-3 items-start">
              <AlertTriangle className="text-[#3B6D11] shrink-0" size={18} />
              <div>
                <p className="font-label-category text-[10px] text-[#3B6D11]">Alerta de Fator Interno</p>
                <p className="font-body text-xs text-[#3B6D11] mt-0.5">{analysis.alertaInterno.descricao}</p>
              </div>
            </div>
          )}

          {isTricoscopia ? (
            <section className="space-y-4">
              <h2 className="font-label-category text-xs font-medium text-[#1C3A2B] flex items-center gap-2">
                <Target size={18} className="text-[#4A7A5C]" />
                Relatório Tricoscópico
              </h2>

              <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-[#1C3A2B] text-[#E8DECE]">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Eye size={18} className="text-[#8FAF8A]" />
                      <h3 className="font-heading text-lg font-normal">Análise da Pele e Fios</h3>
                    </div>
                    <div className="inline-flex rounded-full bg-[#EAF3DE] px-3 py-1 text-[10px] font-medium text-[#3B6D11]">
                      Tricoscopia
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl bg-white/10 p-4 space-y-2">
                      <p className="font-label-category text-[10px] text-[#8FAF8A]">Região analisada</p>
                      <p className="font-body text-xs text-[#E8DECE]/90">{textValue(analysis.regiaoAnalisada)}</p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4 space-y-3">
                      <p className="font-label-category text-[10px] text-[#8FAF8A]">Análise da pele</p>
                      <p className="text-xs text-[#E8DECE]/90">{textValue(analysis.analiseDaPele?.conclusao)}</p>
                      <p className="text-[11px] text-[#E8DECE]/80">{textValue(analysis.analiseDaPele?.descamacaoInterfolicular)}</p>
                      <p className="text-[11px] text-[#E8DECE]/80">{textValue(analysis.analiseDaPele?.descamacaoPerifolicular)}</p>
                      <p className="text-[11px] text-[#E8DECE]/80">{textValue(analysis.analiseDaPele?.coloracaoDescamacao)}</p>
                      <p className="text-[11px] text-[#E8DECE]/80">{textValue(analysis.analiseDaPele?.sinaisProcedimentosAgressivos)}</p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4 space-y-3">
                      <p className="font-label-category text-[10px] text-[#8FAF8A]">Análise dos fios</p>
                      <p className="text-xs text-[#E8DECE]/90">{textValue(analysis.analiseDosFios?.classificacaoFiosPresentes)}</p>
                      <p className="text-[11px] text-[#E8DECE]/80">{textValue(analysis.analiseDosFios?.fioReferencia)}</p>
                      <p className="text-[11px] text-[#E8DECE]/80">{textValue(analysis.analiseDosFios?.pigmentacao)}</p>
                      <p className="text-[11px] text-[#E8DECE]/80">{textValue(analysis.analiseDosFios?.quantidadeDistribuicao)}</p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4 space-y-3">
                      <p className="font-label-category text-[10px] text-[#8FAF8A]">Óstios foliculares</p>
                      <p className="text-[11px] text-[#E8DECE]/80">{textValue(analysis.analiseDosOstiosFoliculares?.ostioVazio)}</p>
                      <p className="text-[11px] text-[#E8DECE]/80">{textValue(analysis.analiseDosOstiosFoliculares?.ostioComFio)}</p>
                      <p className="text-[11px] text-[#E8DECE]/80">{textValue(analysis.analiseDosOstiosFoliculares?.presencaSebo)}</p>
                      <p className="text-[11px] text-[#E8DECE]/80">{textValue(analysis.analiseDosOstiosFoliculares?.atrofiaOuCicatrizFolicular)}</p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4 space-y-3">
                      <p className="font-label-category text-[10px] text-[#8FAF8A]">Conclusão tricoscópica</p>
                      <p className="text-xs text-[#E8DECE]/90">{textValue(analysis.conclusaoTricoscopica?.estadoGeral)}</p>
                      <p className="text-[11px] text-[#E8DECE]/80">{textValue(analysis.conclusaoTricoscopica?.indicadoresPositivos)}</p>
                      <p className="text-[11px] text-[#E8DECE]/80">{textValue(analysis.conclusaoTricoscopica?.pontosDeAtencao)}</p>
                      <p className="text-[11px] text-[#E8DECE]/80">{textValue(analysis.conclusaoTricoscopica?.correlacaoAnaliseVisual)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : (
            <>
              <section className="space-y-4">
                <h2 className="font-label-category text-xs font-medium text-[#1C3A2B] flex items-center gap-2">
                  <Target size={18} className="text-[#4A7A5C]" />
                  Diagnóstico por Região
                </h2>

                {regionEntries.map(([key, data]: [string, any]) => {
                  const theme = getRegionTheme(key);
                  const percent = data.densidade?.percentual || 50;

                  return (
                    <Card
                      key={key}
                      className={cn("border-none shadow-sm rounded-2xl overflow-hidden p-6")}
                      style={{ backgroundColor: theme.bg }}
                    >
                      <div className="space-y-4">
                        <p className="text-[10px] font-normal uppercase tracking-[3px]" style={{ color: theme.labelColor }}>
                          {theme.label}
                        </p>

                        <h3 className="font-heading text-3xl font-medium tracking-[1px]" style={{ color: theme.valueColor }}>
                          {data.densidade?.classificacao || "Densidade"} ({percent}%)
                        </h3>

                        <p className="text-xs font-light leading-relaxed" style={{ color: theme.valueColor }}>
                          {data.descricao}
                        </p>

                        <div className="space-y-1.5">
                          <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${theme.border}22` }}>
                            <div className="h-full rounded-full" style={{ backgroundColor: theme.border, width: `${percent}%` }} />
                          </div>
                          <div className="flex justify-between text-[9px] opacity-80">
                            <span style={{ color: theme.labelColor }}>Densidade Estimada</span>
                            <span style={{ color: theme.valueColor }}>{percent}%</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5">
                          <div className="p-2 rounded-lg bg-black/5">
                            <p className="text-[9px] font-medium uppercase tracking-[1px]" style={{ color: theme.labelColor }}>
                              Espessura
                            </p>
                            <p className="text-xs font-medium" style={{ color: theme.valueColor }}>
                              {data.espessura}
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-black/5">
                            <p className="text-[9px] font-medium uppercase tracking-[1px]" style={{ color: theme.labelColor }}>
                              Pele Exposta
                            </p>
                            <p className="text-xs font-medium" style={{ color: theme.valueColor }}>
                              {data.peleExposta ? "Sim" : "Não"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {data.peleDescricao && (
                            <div className="bg-black/5 p-3 rounded-lg flex items-start gap-2">
                              <Eye size={14} className="mt-0.5" style={{ color: theme.labelColor }} />
                              <div>
                                <p className="text-[9px] font-medium uppercase tracking-[1px]" style={{ color: theme.labelColor }}>
                                  Exposição da Pele
                                </p>
                                <p className="text-xs" style={{ color: theme.valueColor }}>
                                  {data.peleDescricao}
                                </p>
                              </div>
                            </div>
                          )}

                          {data.direcaoFios && (
                            <div className="bg-black/5 p-3 rounded-lg flex items-start gap-2">
                              <MoveUpRight size={14} className="mt-0.5" style={{ color: theme.labelColor }} />
                              <div>
                                <p className="text-[9px] font-medium uppercase tracking-[1px]" style={{ color: theme.labelColor }}>
                                  Direção dos Fios
                                </p>
                                <p className="text-xs" style={{ color: theme.valueColor }}>
                                  {data.direcaoFios}
                                </p>
                              </div>
                            </div>
                          )}

                          {data.caracteristicasEspeciais && (
                            <div className="bg-black/5 p-3 rounded-lg flex items-start gap-2">
                              <Info size={14} className="mt-0.5" style={{ color: theme.labelColor }} />
                              <div>
                                <p className="text-[9px] font-medium uppercase tracking-[1px]" style={{ color: theme.labelColor }}>
                                  Características dos Fios
                                </p>
                                <p className="text-xs" style={{ color: theme.valueColor }}>
                                  {data.caracteristicasEspeciais}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {data.prognostico && (
                          <div className="p-3 bg-black/5 rounded-xl">
                            <p className="text-[9px] font-medium uppercase tracking-[1px] mb-1" style={{ color: theme.labelColor }}>
                              Prognóstico
                            </p>
                            <p className="text-xs italic" style={{ color: theme.valueColor }}>
                              "{data.prognostico}"
                            </p>
                          </div>
                        )}

                        {data.statusMelhoria && (
                          <div className="pt-2 border-t border-black/5">
                            <p className="text-[9px] font-medium uppercase tracking-[1px] mb-1" style={{ color: theme.labelColor }}>
                              Status de Melhoria
                            </p>
                            <p className="text-xs font-medium" style={{ color: theme.valueColor }}>
                              {data.statusMelhoria.descricao}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </section>

              <Card className="border border-[#D4C9B5] bg-[#E8DECE] rounded-3xl">
                <CardHeader>
                  <CardTitle className="font-label-category text-[10px] text-[#1C3A2B] flex items-center gap-2">
                    <ShieldCheck className="text-[#4A7A5C]" size={18} />
                    Visão Geral e Objetivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="font-body text-xs text-[#1C3A2B]/90 leading-relaxed">{analysis.visaoGeral?.descricao}</p>
                  <div className="p-4 bg-[#F5F0E8] rounded-2xl border border-[#D4C9B5]">
                    <p className="font-label-category text-[9px] text-[#4A7A5C] mb-1">Objetivo do Tratamento</p>
                    <p className="font-heading text-sm font-medium text-[#1C3A2B]">{analysis.visaoGeral?.objetivo}</p>
                  </div>
                </CardContent>
              </Card>
            </>
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