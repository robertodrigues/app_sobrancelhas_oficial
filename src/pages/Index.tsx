import { MadeWithDyad } from "@/components/made-with-dyad";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, FileText, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pt-20">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Tricolofia</h1>
          <p className="text-slate-500">Análise capilar de sobrancelhas com IA</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-slate-400">+3 novos esta semana</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Análises Realizadas</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142</div>
              <p className="text-xs text-slate-400">8 aguardando revisão</p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Ações Rápidas</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button asChild variant="outline" className="h-24 flex flex-col gap-2 bg-white border-slate-200 hover:bg-slate-50">
              <Link to="/novo-cliente">
                <Plus size={20} />
                <span>Novo Cliente</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex flex-col gap-2 bg-white border-slate-200 hover:bg-slate-50">
              <Link to="/captura">
                <Camera size={20} />
                <span>Nova Captura</span>
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Atividades Recentes</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-4">
                  <TrendingUp size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Análise de Evolução Gerada</p>
                  <p className="text-xs text-slate-500">Cliente: Maria Silva • Há 2 horas</p>
                </div>
                <Button variant="ghost" size="sm" className="text-primary">Ver</Button>
              </div>
            ))}
          </div>
        </section>
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;