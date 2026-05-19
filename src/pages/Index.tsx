import { MadeWithDyad } from "@/components/made-with-dyad";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, FileText, TrendingUp, Camera, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 md:pt-20">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Olá, Especialista</h1>
            <p className="text-slate-500 font-medium">Pronta para transformar olhares?</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
            <Sparkles size={24} />
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-none shadow-sm bg-white rounded-3xl">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">24</div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clientes</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-none shadow-sm bg-white rounded-3xl">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                  <FileText className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">142</div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Análises</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button asChild variant="ghost" className="h-32 flex flex-col gap-3 bg-white border-none shadow-sm rounded-3xl hover:bg-slate-50 transition-all group">
              <Link to="/novo-cliente">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                  <Plus size={24} />
                </div>
                <span className="font-semibold text-slate-700">Novo Cliente</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" className="h-32 flex flex-col gap-3 bg-accent text-white shadow-lg shadow-accent/20 rounded-3xl hover:bg-accent/90 transition-all">
              <Link to="/captura">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Camera size={24} />
                </div>
                <span className="font-semibold">Nova Captura</span>
              </Link>
            </Button>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Atividades Recentes</h2>
            <Button variant="link" className="text-accent font-semibold text-sm">Ver tudo</Button>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.1 }}
                className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-slate-50 group cursor-pointer hover:border-accent/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mr-4 group-hover:bg-accent/5 transition-colors">
                  <TrendingUp size={20} className="text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">Análise de Evolução</p>
                  <p className="text-xs font-medium text-slate-400">Maria Silva • Há 2 horas</p>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-accent transition-colors" />
              </motion.div>
            ))}
          </div>
        </section>
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;