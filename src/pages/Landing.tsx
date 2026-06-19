"use client";

import React from "react";
import { Sparkles, Camera, FileText, TrendingUp, ShieldCheck, ArrowRight, CheckCircle2, Paintbrush, Users } from "lucide-react";
import Logo from "@/components/ui/Logo";

const Landing = () => {
  const handleGoToApp = () => {
    const isLocal = window.location.hostname.includes("localhost") || window.location.hostname.includes("dyad");
    if (isLocal) {
      window.location.href = "/login";
    } else {
      window.location.href = "https://app.elha.com.br/login";
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] font-sans selection:bg-[#1C3A2B] selection:text-[#E8DECE]">
      {/* Header */}
      <header className="border-b border-[#D4C9B5]/30 bg-[#F5F0E8]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-10 h-10" />
            <span className="font-heading text-lg font-semibold tracking-[2px] uppercase text-[#1C3A2B]">ELHA</span>
          </div>
          <button
            onClick={handleGoToApp}
            className="btn-elha-primary px-5 py-2.5 text-xs shadow-md hover:scale-105 transition-all"
          >
            Acessar Plataforma
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16 md:py-24 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-[#EAF3DE] text-[#3B6D11] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[2px]">
          <Sparkles size={12} /> Inteligência Artificial para Sobrancelhas
        </div>
        <h1 className="font-heading text-4xl md:text-6xl font-normal text-[#1C3A2B] leading-tight max-w-3xl mx-auto">
          Transforme o seu design em um <span className="italic font-medium">diagnóstico científico</span>
        </h1>
        <p className="font-body text-sm md:text-base text-[#4A7A5C] max-w-xl mx-auto font-light leading-relaxed">
          A primeira plataforma de IA e Tricologia dedicada exclusivamente a especialistas em sobrancelhas. Valorize o seu trabalho e encante suas clientes.
        </p>
        <div className="pt-4">
          <button
            onClick={handleGoToApp}
            className="btn-elha-primary px-8 py-4 text-xs gap-2 shadow-lg shadow-[#1C3A2B]/20 hover:scale-105 transition-all inline-flex items-center"
          >
            Começar Agora <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* Mockup / Preview */}
      <section className="px-6 max-w-4xl mx-auto">
        <div className="bg-[#E8DECE] border border-[#D4C9B5] rounded-[32px] p-4 md:p-8 shadow-2xl">
          <div className="aspect-video rounded-2xl overflow-hidden bg-[#1C3A2B] flex items-center justify-center relative">
            <img 
              src="/attachments/antes-e-depois-feed-depois-da-edicao.jpeg" 
              alt="Preview do App" 
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
              <div className="text-white space-y-1">
                <p className="font-heading text-lg font-medium">Editor de Antes & Depois Integrado</p>
                <p className="text-xs text-white/80">Gere montagens profissionais com sua marca d'água e logo em segundos.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <p className="font-label-category text-[10px] text-[#4A7A5C]">Tecnologia de Ponta</p>
          <h2 className="font-heading text-2xl md:text-3xl font-normal text-[#1C3A2B]">O que a ELHA faz por você?</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#E8DECE]/50 border border-[#D4C9B5]/40 p-6 rounded-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#1C3A2B] text-[#E8DECE] flex items-center justify-center">
              <Camera size={20} />
            </div>
            <h3 className="font-heading text-lg font-medium text-[#1C3A2B]">Análise Fotográfica</h3>
            <p className="font-body text-xs text-[#4A7A5C] leading-relaxed">
              Mapeie o ponto inicial, meio e cauda das sobrancelhas e deixe nossa IA analisar a densidade e espessura dos fios.
            </p>
          </div>

          <div className="bg-[#E8DECE]/50 border border-[#D4C9B5]/40 p-6 rounded-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#1C3A2B] text-[#E8DECE] flex items-center justify-center">
              <FileText size={20} />
            </div>
            <h3 className="font-heading text-lg font-medium text-[#1C3A2B]">Relatórios em PDF</h3>
            <p className="font-body text-xs text-[#4A7A5C] leading-relaxed">
              Gere relatórios técnicos e de evolução personalizados com a sua logo e cores para enviar diretamente para a cliente.
            </p>
          </div>

          <div className="bg-[#E8DECE]/50 border border-[#D4C9B5]/40 p-6 rounded-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#1C3A2B] text-[#E8DECE] flex items-center justify-center">
              <Paintbrush size={20} />
            </div>
            <h3 className="font-heading text-lg font-medium text-[#1C3A2B]">Editor de Imagens</h3>
            <p className="font-body text-xs text-[#4A7A5C] leading-relaxed">
              Crie montagens de Antes & Depois perfeitas para o Instagram com ferramentas de zoom, textos e caneta de marcação.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof / Benefits */}
      <section className="bg-[#1C3A2B] text-[#E8DECE] py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#3D6B52] text-[#8FAF8A] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[2px]">
              <ShieldCheck size={12} /> Autoridade Profissional
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-normal leading-tight">
              Eleve o nível do seu atendimento clínico
            </h2>
            <p className="font-body text-xs md:text-sm text-[#8FAF8A] leading-relaxed">
              Não venda apenas design de sobrancelhas. Entregue um tratamento tricológico completo, acompanhado de relatórios visuais que comprovam a eficácia do seu protocolo.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-center gap-2 text-xs">
                <CheckCircle2 size={16} className="text-[#8FAF8A]" /> Fidelização de clientes através de dados reais
              </li>
              <li className="flex items-center gap-2 text-xs">
                <CheckCircle2 size={16} className="text-[#8FAF8A]" /> Valorização do preço do seu serviço
              </li>
              <li className="flex items-center gap-2 text-xs">
                <CheckCircle2 size={16} className="text-[#8FAF8A]" /> Destaque absoluto da concorrência local
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden border-4 border-[#4A7A5C] shadow-2xl">
              <img 
                src="/attachments/antes-e-depois-feed-bingo.jpeg" 
                alt="Resultado Clínico" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D4C9B5]/30 py-12 px-6 text-center bg-[#E8DECE]/20">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-heading text-sm font-semibold tracking-[2px] uppercase text-[#1C3A2B]">ELHA</span>
          </div>
          <p className="text-xs text-[#4A7A5C] font-light">
            &copy; {new Date().getFullYear()} ELHA. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;