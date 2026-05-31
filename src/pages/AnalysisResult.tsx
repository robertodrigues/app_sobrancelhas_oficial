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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { showSuccess, showError } from '@/utils/toast';

const AnalysisResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis, image, allImages } = location.state || {};
  const reportRef = useRef<HTMLDivElement>(null);

  const [pdfLogo, setPdfLogo] = useState<string | null>(null);
  const [pdfBgColor, setPdfBgColor] = useState('#F5F0E8');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Carregar preferências de Ajuste do localStorage
  useEffect(() => {
    const savedLogo = localStorage.getItem('pdf_custom_logo');
    const savedBg = localStorage.getItem('pdf_custom_bg_color');
    if (savedLogo) setPdfLogo(savedLogo);
    if (savedBg) setPdfBgColor(savedBg);
  }, []);

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

  const getRegionTheme = (key: string) => {
    switch (key) {
      case 'inicio': return { 
        type: 'sage',
        bg: 'bg-[#3D6B52]', 
        labelColor: 'text-[#8FAF8A]', 
        valueColor: 'text-[#E8DECE]', 
        subColor: 'text-[#6B9A7C]', 
        progressBg: 'bg-white/10', 
        progressFill: 'bg-[#8FAF8A]',
        label: 'Ponto Inicial' 
      };
      case 'meio': return { 
        type: 'claro',
        bg: 'bg-[#F5F0E8] border border-[#D4C9B5]', 
        labelColor: 'text-[#7A9E8A]', 
        valueColor: 'text-[#1C3A2B]', 
        subColor: 'text-[#7A9060]', 
        progressBg: 'bg-[#D4C9B5]', 
        progressFill: 'bg-[#4A7A5C]',
        label: 'Meio da Sobrancelha' 
      };
      case 'cauda': return { 
        type: 'escuro',
        bg: 'bg-[#1C3A2B]', 
        labelColor: 'text-[#8FAF8A]', 
        valueColor: 'text-[#E8DECE]', 
        subColor: 'text-[#6B9A7C]', 
        progressBg: 'bg-white/10', 
        progressFill: 'bg-[#8FAF8A]',
        label: 'Cauda da Sobrancelha' 
      };
      default: return { 
        type: 'creme',
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

  const hasTwoImages = allImages && Array.isArray(allImages) && allImages.length >= 2;

  const handleGeneratePdf = async () => {
    const element = reportRef.current;
    if (!element) return;

    setIsGeneratingPdf(true);
    try {
      const urlsToPreload: string[] = [];
      if (analysis.isComparativo && hasTwoImages) {
        urlsToPreload.push(allImages[0].url, allImages[1].url);
      } else if (image) {
        urlsToPreload.push(image);
      }
      if (pdfLogo) {
        urlsToPreload.push(pdfLogo);
      }

      await Promise.all(urlsToPreload.map(url => {
        return new Promise((resolve) => {
          const tempImg = new Image();
          tempImg.crossOrigin = 'anonymous';
          tempImg.onload = () => resolve(true);
          tempImg.onerror = () => resolve(false);
          tempImg.src = url;
        });
      }));

      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 4,
        backgroundColor: pdfBgColor,
        logging: false,
        imageTimeout: 0,
        removeContainer: true,
        foreignObjectRendering: false,
        onclone: (doc) => {
          doc.querySelectorAll('img').forEach(img => {
            img.style.display = 'block';
            img.style.imageRendering = 'auto';
          });
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
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
              {analysis.isComparativo ? 'Relatório de Evolução' : 'Relatório Técnico'}
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
                    src={allImages[0].url}
                    crossOrigin="anonymous"
                    className="w-full aspect-square rounded-[12px] object-cover block"
                    alt="Antes"
                    style={{ imageRendering: 'auto' }}
                  />
                </div>
              </div>
              <div className="w-[48%] space-y-2">
                <p className="font-label-category text-[10px] text-[#4A7A5C] text-center">Depois</p>
                <div className="rounded-2xl shadow-md border-2 border-[#4A7A5C] p-1 bg-[#1C3A2B]/5">
                  <img
                    src={allImages[1].url}
                    crossOrigin="anonymous"
                    className="w-full aspect-square rounded-[12px] object-cover block"
                    alt="Depois"
                    style={{ imageRendering: 'auto' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-3xl shadow-lg border-4 border-[#E8DECE] p-2 bg-[#1C3A2B]/5">
              <img
                src={image}
                crossOrigin="anonymous"
                className="w-full aspect-square rounded-[20px] object-cover block"
                alt="Análise"
                style={{ imageRendering: 'auto' }}
              />
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

          <section className="space-y-4">
            <h2 className="font-label-category text-xs font-medium text-[#1C3A2B] flex items-center gap-2">
              <Target size={18} className="text-[#4A7A5C]" />
              Diagnóstico por Região
            </h2>
            
            {Object.entries(analysis.regioes).map(([key, data]: [string, any]) => {
              const theme = getRegionTheme(key);
              const percent = data.densidade?.percentual || 50;
              return (
                <Card key={key} className={cn("border-none shadow-sm rounded-2xl overflow-hidden p-6", theme.bg)}>
                  <div className="space-y-4">
                    {/* Label */}
                    <p className={cn("text-[10px] font-normal uppercase tracking-[3px]", theme.labelColor)}>
                      {theme.label}
                    </p>
                    
                    {/* Valor */}
                    <h3 className={cn("font-heading text-3xl font-medium tracking-[1px]", theme.valueColor)}>
                      {data.densidade?.classificacao || 'Densidade'} ({percent}%)
                    </h3>

                    {/* Subtítulo */}
                    <p className={cn("text-xs font-light leading-relaxed", theme.subColor)}>
                      {data.descricao}
                    </p>

                    {/* Barra de progresso */}
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

                    {/* Outros Detalhes */}
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

          {/* Visão Geral (Card Creme Style) */}
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