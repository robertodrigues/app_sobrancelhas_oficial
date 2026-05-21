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
  MoveUpRight,
  Info,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AnalysisResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis, image } = location.state || {};

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-6">
          <p className="mb-4 text-slate-600">Nenhuma análise encontrada.</p>
          <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (color: string) => {
    switch (color?.toLowerCase()) {
      case 'verde': return 'bg-green-500';
      case 'amarelo': return 'bg-yellow-500';
      case 'vermelho': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusBg = (color: string) => {
    switch (color?.toLowerCase()) {
      case 'verde': return 'bg-green-50 border-green-100';
      case 'amarelo': return 'bg-yellow-50 border-yellow-100';
      case 'vermelho': return 'bg-red-50 border-red-100';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pt-20">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Relatório Técnico</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Tricologia de Sobrancelhas</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3 border-accent/20 bg-accent/5 text-accent">
            <Cpu size={14} />
            {analysis.iaUsada || 'IA Especialista'}
          </Badge>
        </header>

        <div className="space-y-6">
          {/* Imagem Analisada */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg border-4 border-white aspect-video">
            <img src={image} alt="Análise" className="w-full h-full object-cover" />
            <div className="absolute top-4 right-4">
              <Badge className="bg-accent/90 backdrop-blur-sm gap-1">
                <Sparkles size={12} /> Diagnóstico IA
              </Badge>
            </div>
          </div>

          {/* Alerta de Causa Interna */}
          {analysis.alertaInterno?.presente && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 items-start">
              <AlertTriangle className="text-amber-600 shrink-0" size={20} />
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase">Alerta de Fator Interno</p>
                <p className="text-sm text-amber-700">{analysis.alertaInterno.descricao}</p>
              </div>
            </div>
          )}

          {/* Análise por Região */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Target size={20} className="text-accent" />
              Análise por Região
            </h2>
            
            {Object.entries(analysis.regioes).map(([key, data]: [string, any]) => (
              <Card key={key} className={cn("border shadow-sm rounded-2xl overflow-hidden", getStatusBg(data.statusMelhoria?.cor))}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold capitalize">
                    {key === 'inicio' ? 'Ponto Inicial' : key === 'meio' ? 'Meio da Sobrancelha' : 'Cauda da Sobrancelha'}
                  </CardTitle>
                  <div className={cn("w-3 h-3 rounded-full shadow-sm", getStatusColor(data.statusMelhoria?.cor))} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-700 leading-relaxed">{data.descricao}</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/50 p-2 rounded-lg border border-white/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Densidade</p>
                      <p className="text-sm font-bold text-slate-900">{data.densidade?.classificacao} ({data.densidade?.percentual}%)</p>
                    </div>
                    <div className="bg-white/50 p-2 rounded-lg border border-white/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Espessura</p>
                      <p className="text-sm font-bold text-slate-900">{data.espessura}</p>
                    </div>
                    <div className="bg-white/50 p-2 rounded-lg border border-white/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Pele Exposta</p>
                      <p className="text-sm font-bold text-slate-900">
                        {data.peleExposta ? 'Sim' : 'Não'}
                      </p>
                    </div>
                    <div className="bg-white/50 p-2 rounded-lg border border-white/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Escala de Dano</p>
                      <p className="text-sm font-bold text-slate-900">{data.escalaDano?.classificacao} ({data.escalaDano?.percentual}%)</p>
                    </div>
                  </div>

                  {/* Detalhes Adicionais */}
                  <div className="grid grid-cols-1 gap-2">
                    {data.peleDescricao && (
                      <div className="bg-white/50 p-3 rounded-lg border border-white/50 flex items-start gap-2">
                        <Eye size={14} className="text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Exposição da Pele</p>
                          <p className="text-xs text-slate-700">{data.peleDescricao}</p>
                        </div>
                      </div>
                    )}
                    {data.direcaoFios && (
                      <div className="bg-white/50 p-3 rounded-lg border border-white/50 flex items-start gap-2">
                        <MoveUpRight size={14} className="text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Direção dos Fios</p>
                          <p className="text-xs text-slate-700">{data.direcaoFios}</p>
                        </div>
                      </div>
                    )}
                    {data.caracteristicasEspeciais && (
                      <div className="bg-white/50 p-3 rounded-lg border border-white/50 flex items-start gap-2">
                        <Info size={14} className="text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Características dos Fios</p>
                          <p className="text-xs text-slate-700">{data.caracteristicasEspeciais}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-white/40 rounded-xl border border-white/40">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Prognóstico</p>
                    <p className="text-xs text-slate-700 italic">"{data.prognostico}"</p>
                  </div>

                  {data.statusMelhoria && (
                    <div className="pt-2 border-t border-white/30">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status de Melhoria</p>
                      <p className="text-xs font-medium text-slate-700">{data.statusMelhoria.descricao}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Resumo Geral */}
          <Card className="border-none shadow-sm bg-white rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="text-accent" size={20} />
                Visão Geral e Objetivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Visão Geral</p>
                <p className="text-sm text-slate-600 leading-relaxed">{analysis.visaoGeral?.descricao}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Resumo Técnico Geral</p>
                <p className="text-sm text-slate-600 leading-relaxed">{analysis.visaoGeral?.resumoTecnico}</p>
              </div>
              <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
                <p className="text-xs font-bold text-accent uppercase mb-1">Objetivo do Tratamento</p>
                <p className="text-sm text-slate-800 font-medium">{analysis.visaoGeral?.objetivo}</p>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full h-14 text-lg gap-2 rounded-2xl shadow-xl shadow-accent/20 bg-accent hover:bg-accent/90">
            <Download size={20} />
            Gerar Relatório PDF
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AnalysisResult;