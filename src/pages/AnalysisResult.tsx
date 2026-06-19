"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { showSuccess, showError } from '@/utils/toast';

const getSavedAnalysisState = () => {
  try {
    const raw = sessionStorage.getItem('elha:last-analysis');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const isRemoteImage = (src: string) => /^https?:\/\//i.test(src);

const getPdfSafeImageSrc = (src: string) => {
  if (!src) return src;
  if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/')) return src;
  if (!isRemoteImage(src)) return src;
  const cleanUrl = src.replace(/^https?:\/\//, '');
  return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
};

const fetchImageAsDataUrl = async (src: string) => {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error('Não foi possível carregar a imagem para o PDF.');
  }

  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Não foi possível converter a imagem.'));
    reader.readAsDataURL(blob);
  });
};

const waitForImageLoads = async (container: HTMLElement) => {
  const images = Array.from(container.querySelectorAll('img'));

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }

          const timeout = window.setTimeout(() => resolve(), 6000);

          img.onload = () => {
            window.clearTimeout(timeout);
            resolve();
          };

          img.onerror = () => {
            window.clearTimeout(timeout);
            resolve();
          };
        }),
    ),
  );
};

const waitForDecodedImage = async (img: HTMLImageElement) => {
  if (typeof img.decode === 'function') {
    try {
      await img.decode();
      return;
    } catch {
      return;
    }
  }

  await new Promise<void>((resolve) => {
    if (img.complete && img.naturalWidth > 0) {
      resolve();
      return;
    }

    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
};

const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T) =>
  Promise.race([
    promise,
    new Promise<T>((resolve) => {
      window.setTimeout(() => resolve(fallback), ms);
    }),
  ]);

const AnalysisResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = (location.state as { analysis?: any; image?: string; allImages?: any[] } | null) || null;

  let savedState: { analysis?: any; image?: string; allImages?: any[] } | null = null;
  try {
    savedState = getSavedAnalysisState();
  } catch (error) {
    console.error('[AnalysisResult] Error reading saved analysis state:', error);
    savedState = null;
  }

  useEffect(() => {
    if (routeState?.analysis || routeState?.image) {
      sessionStorage.setItem('elha:last-analysis', JSON.stringify(routeState));
    }
  }, [routeState]);

  const analysis = routeState?.analysis ?? savedState?.analysis ?? null;
  const image = routeState?.image ?? savedState?.image ?? analysis?.image_url ?? null;
  const allImages = routeState?.allImages ?? savedState?.allImages ?? null;
  const reportRef = useRef<HTMLDivElement>(null);

  const [pdfLogo, setPdfLogo] = useState<string | null>(null);
  const [pdfBgColor, setPdfBgColor] = useState('#F5F0E8');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [reportImage, setReportImage] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const savedLogo = localStorage.getItem('pdf_custom_logo');
    const savedBg = localStorage.getItem('pdf_custom_bg_color');
    if (savedLogo) setPdfLogo(savedLogo);
    if (savedBg) setPdfBgColor(savedBg);
  }, []);

  const resolvedImage = (() => {
    const fromAllImages =
      Array.isArray(allImages) && allImages.length > 0
        ? allImages[allImages.length - 1]?.dataUrl || allImages[allImages.length - 1]?.url || null
        : null;

    return fromAllImages || image || analysis?.image_url || null;
  })();

  const comparisonBeforeImage = Array.isArray(allImages) && allImages.length > 0
    ? allImages[0]?.dataUrl || allImages[0]?.url
    : null;

  const comparisonAfterImage = Array.isArray(allImages) && allImages.length > 1
    ? allImages[1]?.dataUrl || allImages[1]?.url
    : null;

  useEffect(() => {
    setReportImage(resolvedImage || null);
    setImageFailed(false);
  }, [resolvedImage]);

  const hasTwoImages = Array.isArray(allImages) && allImages.length >= 2;
  const displayImage = reportImage || resolvedImage;
  const displayBeforeImage = comparisonBeforeImage;
  const displayAfterImage = comparisonAfterImage;

  const handleImageError = () => {
    setImageFailed(true);
  };

  const handleImageLoad = () => {
    setImageFailed(false);
  };

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] text-[#1C3A2B]">
        <div className="text-center p-6">
          <p className="mb-4 font-body text-sm text-[#4A7A5C]">Nenhuma análise encontrada.</p>
          <Button onClick={() => navigate('/')} className="btn-elha-primary px-6 h-11">Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  const regionEntries = Object.entries(analysis.regioes || {});
  const isTricoscopia = analysis.modoAnalise === 'tricoscopia';

  const getRegionTheme = (key: string) => {
    switch (key) {
      case 'inicio':
        return {
          type: 'verde',
          bg: 'bg-[#EAF3DE] border border-[#16A34A]/20',
          labelColor: 'text-[#166534]',
          valueColor: 'text-[#14532D]',
          subColor: 'text-[#166534]/80',
          progressBg: 'bg-[#D1FAE5]',
          progressFill: 'bg-[#16A34A]',
          label: 'Ponto Inicial'
        };
      case 'meio':
        return {
          type: 'amarelo',
          bg: 'bg-[#FEF3C7] border border-[#EAB308]/25',
          labelColor: 'text-[#A16207]',
          valueColor: 'text-[#78350F]',
          subColor: 'text-[#A16207]/80',
          progressBg: 'bg-[#FDE68A]',
          progressFill: 'bg-[#EAB308]',
          label: 'Meio da Sobrancelha'
        };
      case 'cauda':
        return {
          type: 'vermelho',
          bg: 'bg-[#FEE2E2] border border-[#DC2626]/25',
          labelColor: 'text-[#991B1B]',
          valueColor: 'text-[#7F1D1D]',
          subColor: 'text-[#991B1B]/80',
          progressBg: 'bg-[#FCA5A5]',
          progressFill: 'bg-[#DC2626]',
          label: 'Cauda da Sobrancelha'
        };
      default:
        return {
          type: 'neutro',
          bg: 'bg-[#E8DECE]',
          labelColor: 'text-[#1C3A2B]/60',
          valueColor: 'text-[#1C3A2B]',
          subColor: 'text-[#1C3A2B]/80',
          progressBg: 'bg-[#D4C9B5]',
          progressFill: 'bg-[#1C3A2B]',
          label: key
        };
    }
  };

  const textValue = (value: unknown) => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.filter(Boolean).join(' • ');
    return '';
  };

  const handleGeneratePdf = async () => {
    const element = reportRef.current;
    if (!element) return;

    setIsGeneratingPdf(true);
    try {
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'fixed';
      exportContainer.style.left = '-10000px';
      exportContainer.style.top = '0';
      exportContainer.style.width = `${element.getBoundingClientRect().width}px`;
      exportContainer.style.pointerEvents = 'none';
      exportContainer.style.backgroundColor = pdfBgColor;
      exportContainer.style.zIndex = '-1';
      exportContainer.style.padding = '16px';

      const clone = element.cloneNode(true) as HTMLDivElement;
      exportContainer.appendChild(clone);

      const originalEls = element.querySelectorAll('*');
      const cloneEls = clone.querySelectorAll('*');

      originalEls.forEach((origEl, i) => {
        const cloneEl = cloneEls[i] as HTMLElement;
        if (!cloneEl) return;
        const computed = window.getComputedStyle(origEl as HTMLElement);
        cloneEl.style.backgroundColor = computed.backgroundColor;
        cloneEl.style.color = computed.color;
        cloneEl.style.borderColor = computed.borderColor;
        cloneEl.style.boxShadow = computed.boxShadow;
      });

      document.body.appendChild(exportContainer);

      try {
        const images = Array.from(clone.querySelectorAll('img')) as HTMLImageElement[];

        await Promise.all(
          images.map(async (img) => {
            const originalSrc = img.getAttribute('src') || '';
            if (!originalSrc) return;

            let dataUrl = '';

            try {
              dataUrl = await withTimeout(fetchImageAsDataUrl(originalSrc), 6000, '');
            } catch {
              dataUrl = '';
            }

            if (!dataUrl && isRemoteImage(originalSrc)) {
              try {
                const proxied = getPdfSafeImageSrc(originalSrc);
                dataUrl = await withTimeout(fetchImageAsDataUrl(proxied), 6000, '');
              } catch {
                dataUrl = '';
              }
            }

            img.setAttribute('src', dataUrl || originalSrc);
            img.removeAttribute('srcset');
            img.removeAttribute('sizes');
            img.setAttribute('crossorigin', 'anonymous');
            img.style.display = 'block';
            img.style.imageRendering = 'auto';
            await waitForDecodedImage(img);
          }),
        );

        await waitForImageLoads(exportContainer);
        await new Promise((resolve) => requestAnimationFrame(() => resolve(true)));
        await new Promise((resolve) => requestAnimationFrame(() => resolve(true)));

        const canvas = await html2canvas(exportContainer, {
          useCORS: true,
          allowTaint: false,
          scale: 3,
          backgroundColor: pdfBgColor,
          logging: false,
          imageTimeout: 10000,
          removeContainer: true,
          foreignObjectRendering: false,
        });

        const safeCanvas = document.createElement('canvas');
        safeCanvas.width = canvas.width;
        safeCanvas.height = canvas.height;
        const safeCtx = safeCanvas.getContext('2d');
        if (safeCtx) {
          safeCtx.fillStyle = pdfBgColor;
          safeCtx.fillRect(0, 0, safeCanvas.width, safeCanvas.height);
          safeCtx.drawImage(canvas, 0, 0);
        }

        const imgData = safeCanvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pageHeight;
        }

        pdf.save(`relatorio-diagnostico-${analysis.isComparativo ? 'evolucao' : 'tecnico'}.pdf`);
        showSuccess('Relatório PDF gerado com sucesso!');
      } finally {
        document.body.removeChild(exportContainer);
      }
    } catch (error) {
      console.error(error);
      showError('Erro ao gerar o PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div style={{ backgroundColor: pdfBgColor }} className="min-h-screen pb-24 md:pt-20 transition-colors duration-300 text-[#1C3A2B]">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <header className="relative flex flex-col items-center justify-center mb-8 text-center pt-4">
          <button onClick={() => navigate('/')} className="absolute left-0 p-2 hover:bg-[#E8DECE] rounded-full transition-colors text-[#1C3A2B]">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-heading text-2xl font-normal text-[#1C3A2B]">
              {analysis.isComparativo ? 'Relatório de Evolução' : isTricoscopia ? 'Relatório Tricoscópico' : 'Relatório Técnico'}
            </h1>
            <p className="font-label-category text-[10px] text-[#4A7A5C] mt-0.5">Tricologia de Sobrancelhas</p>
          </div>
        </header>

        <div ref={reportRef} className="space-y-6 p-4 rounded-3xl">
          
          {pdfLogo && (
            <div className="flex justify-center py-4 border-b border-[#D4C9B5]/50">
              <img src={pdfLogo} className="h-16 object-contain" alt="Logo Designer" />
            </div>
          )}

          {analysis.isComparativo && hasTwoImages ? (
            <div className="flex flex-row justify-between gap-4 w-full">
              <div className="w-[48%] space-y-2">
                <p className="font-label-category text-[10px] text-[#4A7A5C] text-center">Antes</p>
                <div className="rounded-2xl shadow-md border-2 border-[#E8DECE] p-1 bg-[#1C3A2B]/5">
                  <img
                    src={displayBeforeImage || ''}
                    className="w-full aspect-square rounded-[12px] object-contain bg-[#F5F0E8] block"
                    alt="Antes"
                    style={{ imageRendering: 'auto' }}
                    loading="eager"
                  />
                </div>
              </div>
              <div className="w-[48%] space-y-2">
                <p className="font-label-category text-[10px] text-[#4A7A5C] text-center">Depois</p>
                <div className="rounded-2xl shadow-md border-2 border-[#4A7A5C] p-1 bg-[#1C3A2B]/5">
                  <img
                    src={displayAfterImage || ''}
                    className="w-full aspect-square rounded-[12px] object-contain bg-[#F5F0E8] block"
                    alt="Depois"
                    style={{ imageRendering: 'auto' }}
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-3xl shadow-lg border-4 border-[#E8DECE] p-2 bg-[#1C3A2B]/5 min-h-[280px] flex items-center justify-center overflow-hidden">
                {displayImage && !imageFailed ? (
                  <img
                    key={displayImage}
                    src={displayImage}
                    className="w-full aspect-square rounded-[20px] object-contain bg-[#F5F0E8] block"
                    alt="Análise"
                    style={{ imageRendering: 'auto' }}
                    loading="eager"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
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
                  <div className="tag-elha">
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
                    <div className="tag-elha">Tricoscopia</div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl bg-white/10 p-4 space-y-2">
                      <p className="font-label-category text-[10px] text-[#8FAF8A]">Região analisada</p>
                      <p className="font-body text-xs text-[#E8DECE]/90">{textValue(analysis.regiaoAnalisada)}</p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4 space-y-3">
                      <p className="font-label-category text-[10px] text-[#8FAF8A]">Análise da pele</p>
                      <p className="text-xs text-[#E8DECE]/90">{textValue(analysis.analiseDaPele?.conclusao || analysis.analiseDaPele)}</p>
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
                    <Card key={key} className={cn("border-none shadow-sm rounded-2xl overflow-hidden p-6", theme.bg)}>
                      <div className="space-y-4">
                        <p className={cn("text-[10px] font-normal uppercase tracking-[3px]", theme.labelColor)}>
                          {theme.label}
                        </p>
                        
                        <h3 className={cn("font-heading text-3xl font-medium tracking-[1px]", theme.valueColor)}>
                          {data.densidade?.classificacao || 'Densidade'} ({percent}%)
                        </h3>

                        <p className={cn("text-xs font-light leading-relaxed", theme.subColor)}>
                          {data.descricao}
                        </p>

                        <div className="space-y-1.5">
                          <div className={cn("w-full h-1 rounded-full overflow-hidden", theme.progressBg)}>
                            <div 
                              className={cn("h-full rounded-full", theme.progressFill)} 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] opacity-80">
                            <span className={theme.labelColor}>Densidade Estimada</span>
                            <span className={theme.valueColor}>{percent}%</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5">
                          <div className="p-2 rounded-lg bg-black/5">
                            <p className={cn("text-[9px] font-medium uppercase tracking-[1px]", theme.labelColor)}>Espessura</p>
                            <p className={cn("text-xs font-medium", theme.valueColor)}>{data.espessura}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-black/5">
                            <p className={cn("text-[9px] font-medium uppercase tracking-[1px]", theme.labelColor)}>Pele Exposta</p>
                            <p className={cn("text-xs font-medium", theme.valueColor)}>{data.peleExposta ? 'Sim' : 'Não'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {data.peleDescricao && (
                            <div className="bg-black/5 p-3 rounded-lg flex items-start gap-2">
                              <Eye size={14} className={cn("mt-0.5", theme.labelColor)} />
                              <div>
                                <p className={cn("text-[9px] font-medium uppercase tracking-[1px]", theme.labelColor)}>Exposição da Pele</p>
                                <p className={cn("text-xs", theme.valueColor)}>{data.peleDescricao}</p>
                              </div>
                            </div>
                          )}
                          {data.direcaoFios && (
                            <div className="bg-black/5 p-3 rounded-lg flex items-start gap-2">
                              <MoveUpRight size={14} className={cn("mt-0.5", theme.labelColor)} />
                              <div>
                                <p className={cn("text-[9px] font-medium uppercase tracking-[1px]", theme.labelColor)}>Direção dos Fios</p>
                                <p className={cn("text-xs", theme.valueColor)}>{data.direcaoFios}</p>
                              </div>
                            </div>
                          )}
                          {data.caracteristicasEspeciais && (
                            <div className="bg-black/5 p-3 rounded-lg flex items-start gap-2">
                              <Info size={14} className={cn("mt-0.5", theme.labelColor)} />
                              <div>
                                <p className={cn("text-[9px] font-medium uppercase tracking-[1px]", theme.labelColor)}>Características dos Fios</p>
                                <p className={cn("text-xs", theme.valueColor)}>{data.caracteristicasEspeciais}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {data.prognostico && (
                          <div className="p-3 bg-black/5 rounded-xl">
                            <p className={cn("text-[9px] font-medium uppercase tracking-[1px] mb-1", theme.labelColor)}>Prognóstico</p>
                            <p className={cn("text-xs italic", theme.subColor)}>"{data.prognostico}"</p>
                          </div>
                        )}

                        {data.statusMelhoria && (
                          <div className="pt-2 border-t border-black/5">
                            <p className={cn("text-[9px] font-medium uppercase tracking-[1px] mb-1", theme.labelColor)}>Status de Melhoria</p>
                            <p className={cn("text-xs font-medium", theme.valueColor)}>{data.statusMelhoria.descricao}</p>
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
          <Button 
            onClick={handleGeneratePdf} 
            disabled={isGeneratingPdf}
            className="btn-elha-primary w-full h-14"
          >
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