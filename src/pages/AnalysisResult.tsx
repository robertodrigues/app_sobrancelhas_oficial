import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Share2, Download, Sparkles, Activity, Target, ShieldCheck } from 'lucide-react';

const AnalysisResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis, image } = location.state || {};

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Nenhuma análise encontrada.</p>
        <Button onClick={() => navigate('/')}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pt-20">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Diagnóstico IA</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full">
              <Share2 size={18} />
            </Button>
          </div>
        </header>

        <div className="space-y-6">
          {/* Imagem Analisada */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg border-4 border-white aspect-video">
            <img src={image} alt="Análise" className="w-full h-full object-cover" />
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary/90 backdrop-blur-sm gap-1">
                <Sparkles size={12} /> IA Ativa
              </Badge>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Activity className="text-blue-500 mb-2" size={24} />
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Densidade</span>
                <span className="text-lg font-bold text-slate-900 capitalize">{analysis.density}</span>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Target className="text-purple-500 mb-2" size={24} />
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Simetria</span>
                <span className="text-lg font-bold text-slate-900">{analysis.symmetry_score}%</span>
              </CardContent>
            </Card>
          </div>

          {/* Observações */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="text-green-500" size={18} />
                Saúde e Observações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {analysis.observations}
              </p>
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Status de Saúde</p>
                <p className="text-sm text-green-800">{analysis.health_status}</p>
              </div>
            </CardContent>
          </Card>

          {/* Recomendações */}
          <Card className="border-none shadow-sm bg-primary text-white">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles size={18} />
                Plano de Tratamento Recomendado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm bg-white/10 p-3 rounded-xl">
                    <span className="font-bold opacity-50">{i + 1}</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Button className="w-full h-14 text-lg gap-2 rounded-2xl shadow-xl shadow-primary/20">
            <Download size={20} />
            Gerar Relatório PDF
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AnalysisResult;