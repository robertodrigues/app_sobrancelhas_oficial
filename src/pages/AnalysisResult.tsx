import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  Sparkles, 
  AlertTriangle, 
  Target, 
  ShieldCheck, 
  Cpu,
  TrendingUp,
  CheckCircle2,
  Eye,
  MoveUpRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AnalysisResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis, image, allImages } = location.state || {};

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-6">
          <p className="mb-4 text-slate-600 text-sm">Nenhuma análise encontrada.</p>
          <Button onClick={() => navigate('/')} className="rounded-xl">Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  const getRegionTheme = (key: string) => {
    switch (key) {
      case 'inicio': return { dot: 'bg-green-500', bg: 'bg-green-50 border-green-100', label: 'Ponto Inicial' };
      case 'meio': return { dot: 'bg-yellow-500', bg: 'bg-yellow-50 border-yellow-100', label: 'Meio da Sobrancelha' };
      case 'cauda': return { dot: 'bg-red-500', bg: 'bg-red-50 border-red-100', label: 'Cauda da Sobrancelha' };
      default: return { dot: 'bg-slate-400', bg: 'bg-slate-50 border-slate-100', label: key };
    }
  };

  const hasTwoImages = allImages && Array.isArray(allImages) && allImages.length >= 2;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pt-20">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <header className="relative flex flex-col items-center justify-center mb-8 text-center">
          <button onClick={() => navigate('/')} className="absolute left-0 p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {analysis.isComparativo ? 'Relatório de Evolução' : 'Relatório Técnico'}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Tricologia de Sobrancelhas</p>
          </div>
          <div className="absolute right-0">
            <Badge variant="outline" className="gap-1 py-1 px-2 border-accent/20 bg-accent/5 text-accent text-[10px]">
              <Cpu size={12} /> {analysis.iaUsada || 'IA'}
            </Badge>
          </div>
        </header>

        <div className="space-y-6">
          {/* Imagens Analisadas */}
          {analysis.isComparativo && hasTwoImages ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase text-center">Antes</p>
                <div className="rounded-2xl overflow-hidden shadow-md border-2 border-white aspect-[3/4]">
                  <img src={allImages[0].url} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-accent uppercase text-center">Depois</p>
                <div className="rounded-2xl overflow-hidden shadow-md border-2 border-accent aspect-[3/4]">
                  <img src={allImages[1].url} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden shadow-lg border-4 border-white aspect-video">
              <img src={image} alt="Análise" className="w-full h-full object-cover" />
              {analysis.isComparativo && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-accent text-white border-none shadow-lg text-[10px]">Montagem Técnica</Badge>
                </div>
              )}
            </div>
          )}

          {/* Status de Comparação */}
          {analysis.isComparativo && analysis.comparativo && (
            <Card className="border-none shadow-lg bg-accent text-white rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={20} />
                    <h3 className="font-bold text-base">Análise de Evolução</h3>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold">
                    +{analysis.comparativo.melhoriaPercentualEstimada}% Melhoria
                  </div>
                </div>
                <p className="text-xs text-white/90 leading-relaxed mb-4">{analysis.comparativo.evolucaoGeral}</p>
                <div className="bg-white/10 p-3 rounded-xl flex items-start gap-2">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium">Destaque: {analysis.comparativo.destaquePositivo}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerta de Causa Interna */}
          {analysis.alertaInterno?.presente && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 items-start">
              <AlertTriangle className="text-amber-600 shrink-0" size={18} />
              <div>
                <p className="text-[10px] font-bold text-amber-800 uppercase">Alerta de Fator Interno</p>
                <p className="text-xs text-amber-700 mt-0.5">{analysis.alertaInterno.descricao}</p>
              </div>
            </div>
          )}

          {/* Análise por Região */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
              <Target size={18} className="text-accent" />
              Diagnóstico por Região
            </h2>
            
            {Object.entries(analysis.regioes).map(([key, data]: [string, any]) => {
              const theme = getRegionTheme(key);
              return (
                <Card key={key} className={cn("border shadow-sm rounded-2xl overflow-hidden", theme.bg)}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider">{theme.label}</CardTitle>
                    <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", theme.dot)} />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-slate-700 leading-relaxed">{data.descricao}</p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/50 p-2 rounded-lg border border-white/50">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Densidade</p>
                        <p className="text-xs font-bold text-slate-900">{data.densidade?.classificacao} ({data.densidade?.percentual}%)</p>
                      </div>
                      <div className="bg-white/50 p-2 rounded-lg border border-white/50">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Espessura</p>
                        <p className="text-xs font-bold text-slate-900">{data.espessura}</p>
                      </div>
                      <div className="bg-white/50 p-2 rounded-lg border border-white/50">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Pele Exposta</p>
                        <p className="text-xs font-bold text-slate-900">{data.peleExposta ? 'Sim' : 'Não'}</p>
                      </div>
                      <div className="bg-white/50 p-2 rounded-lg border border-white/50">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Escala de Dano</p>
                        <p className="text-xs font-bold text-slate-900">{data.escalaDano?.classificacao || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {data.peleDescricao && (
                        <div className="bg-white/50 p-3 rounded-lg border border-white/50 flex items-start gap-2">
                          <Eye size={14} className="text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Exposição da Pele</p>
                            <p className="text-xs text-slate-700">{data.peleDescricao}</p>
                          </div>
                        </div>
                      )}
                      {data.direcaoFios && (
                        <div className="bg-white/50 p-3 rounded-lg border border-white/50 flex items-start gap-2">
                          <MoveUpRight size={14} className="text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Direção dos Fios</p>
                            <p className="text-xs text-slate-700">{data.direcaoFios}</p>
                          </div>
                        </div>
                      )}
                      {data.caracteristicasEspeciais && (
                        <div className="bg-white/50 p-3 rounded-lg border border-white/50 flex items-start gap-2">
                          <Info size={14} className="text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Características dos Fios</p>
                            <p className="text-xs text-slate-700">{data.caracteristicasEspeciais}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-white/40 rounded-xl border border-white/40">
                      <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Prognóstico</p>
                      <p className="text-xs text-slate-700 italic">"{data.prognostico}"</p>
                    </div>

                    {data.statusMelhoria && (
                      <div className="pt-2 border-t border-white/30">
                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Status de Melhoria</p>
                        <p className="text-xs font-medium text-slate-700">{data.statusMelhoria.descricao}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </section>

          {/* Resumo Geral */}
          <Card className="border-none shadow-sm bg-white rounded-3xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                <ShieldCheck className="text-accent" size={18} />
                Visão Geral e Objetivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">{analysis.visaoGeral?.descricao}</p>
              <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
                <p className="text-[10px] font-bold text-accent uppercase mb-1">Objetivo do Tratamento</p>
                <p className="text-xs text-slate-800 font-medium">{analysis.visaoGeral?.objetivo}</p>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full h-14 text-sm gap-2 rounded-2xl shadow-xl shadow-accent/20 bg-accent hover:bg-accent/90 font-bold">
            <Download size={18} /> Gerar Relatório PDF
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AnalysisResult;