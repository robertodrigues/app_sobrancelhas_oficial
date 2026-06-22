"use client";

import React from "react";
import { 
  Sparkles, 
  Camera, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Eye
} from "lucide-react";
import Logo from "@/components/ui/Logo";

const Landing = () => {
  const handleGoToApp = () => {
    window.location.href = "https://app.elha.com.br/login";
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] font-sans selection:bg-[#1C3A2B] selection:text-[#E8DECE] overflow-x-hidden">
      
      {/* Header */}
      <header className="border-b border-[#D4C9B5]/30 bg-[#F5F0E8]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="font-heading text-lg font-medium tracking-[4px] uppercase text-[#1C3A2B]">ELHA</span>
          </div>
          <button
            onClick={handleGoToApp}
            className="btn-elha-primary px-6 py-3 text-[10px] shadow-md hover:scale-105 transition-all"
          >
            Acessar App
          </button>
        </div>
      </header>

      {/* 1. Hero Section */}
      <section className="px-6 py-20 md:py-32 max-w-5xl mx-auto text-center space-y-8">
        {/* Prova Social: Avatares de Mulheres + Texto */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <div className="flex -space-x-3">
            <img 
              className="w-10 h-10 rounded-full border-2 border-[#F5F0E8] object-cover shadow-sm" 
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80" 
              alt="Especialista 1" 
            />
            <img 
              className="w-10 h-10 rounded-full border-2 border-[#F5F0E8] object-cover shadow-sm" 
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80" 
              alt="Especialista 2" 
            />
            <img 
              className="w-10 h-10 rounded-full border-2 border-[#F5F0E8] object-cover shadow-sm" 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80" 
              alt="Especialista 3" 
            />
            <img 
              className="w-10 h-10 rounded-full border-2 border-[#F5F0E8] object-cover shadow-sm" 
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80" 
              alt="Especialista 4" 
            />
          </div>
          <span className="font-heading text-sm font-medium text-[#1C3A2B] tracking-wide">
            + de 500 Stúdios usam
          </span>
        </div>
        
        <div className="inline-flex items-center gap-2 bg-[#EAF3DE] text-[#3B6D11] px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[2px] font-label-category">
          <Sparkles size={12} /> Análise Inteligente
        </div>
        
        <h1 className="font-heading text-3xl md:text-6xl font-normal text-[#1C3A2B] leading-tight max-w-4xl mx-auto">
          Transforme o seu design em um <span className="font-medium">diagnóstico clínico e científico</span>
        </h1>
        
        <p className="font-body text-sm md:text-base text-[#4A7A5C] max-w-2xl mx-auto font-light leading-relaxed">
          A primeira plataforma de inteligência e tricologia dedicada exclusivamente a especialistas em sobrancelhas. Eleve o nível do seu atendimento e encante suas clientes com relatórios técnicos personalizados.
        </p>
        
        <div className="pt-4">
          <button
            onClick={handleGoToApp}
            className="btn-elha-primary px-10 py-5 text-[11px] gap-2.5 shadow-lg shadow-[#1C3A2B]/10 hover:scale-105 transition-all inline-flex items-center"
          >
            Começar Agora <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* 2. O Problema que Resolvemos */}
      <section className="bg-[#E8DECE] border-y border-[#D4C9B5]/50 py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <p className="font-label-category text-[10px] text-[#4A7A5C] tracking-[3px] uppercase">A Evolução do Mercado</p>
            <h2 className="font-heading text-2xl md:text-4xl font-normal text-[#1C3A2B] leading-tight">
              O design de sobrancelhas deixou de ser apenas intuitivo
            </h2>
            <p className="font-body text-sm text-[#4A7A5C] leading-relaxed font-light">
              Por muito tempo, a avaliação das sobrancelhas foi baseada apenas no "olhômetro" e na intuição. Isso dificultava a valorização do serviço e a comprovação real dos resultados de tratamentos de reconstrução e crescimento.
            </p>
            <p className="font-body text-sm text-[#1C3A2B] leading-relaxed font-medium">
              O ELHA muda essa realidade ao traduzir a saúde dos fios e da pele em dados técnicos e visuais, gerando autoridade imediata e um diferencial competitivo inalcançável para o seu estúdio.
            </p>
          </div>
          <div className="relative flex justify-center">
            <div className="w-full max-w-md rounded-3xl border border-[#D4C9B5] bg-[#F5F0E8] p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-[#D4C9B5]/40">
                <div className="w-10 h-10 rounded-full bg-[#1C3A2B]/10 flex items-center justify-center text-[#1C3A2B]">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="font-heading text-sm font-medium text-[#1C3A2B]">Método Científico</p>
                  <p className="text-[10px] text-[#4A7A5C]">Valorização profissional</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 size={16} className="text-[#3B6D11] shrink-0 mt-0.5" />
                  <span className="text-[#1C3A2B]/90 text-xs md:text-sm">Mapeamento preciso de densidade e espessura</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 size={16} className="text-[#3B6D11] shrink-0 mt-0.5" />
                  <span className="text-[#1C3A2B]/90 text-xs md:text-sm">Comprovação visual de evolução técnica</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 size={16} className="text-[#3B6D11] shrink-0 mt-0.5" />
                  <span className="text-[#1C3A2B]/90 text-xs md:text-sm">Fidelização baseada em dados reais e relatórios</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Funcionalidades (cards) */}
      <section className="px-6 py-24 max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-3">
          <p className="font-label-category text-[10px] text-[#4A7A5C] tracking-[3px] uppercase">Recursos Exclusivos</p>
          <h2 className="font-heading text-2xl md:text-4xl font-normal text-[#1C3A2B]">Desenvolvido para a sua rotina clínica</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1 */}
          <div className="bg-[#E8DECE]/40 border border-[#D4C9B5]/40 p-8 rounded-2xl space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#1C3A2B] text-[#E8DECE] flex items-center justify-center">
                <Camera size={20} />
              </div>
              <h3 className="font-heading text-lg font-medium text-[#1C3A2B]">Análise com Inteligência Artificial</h3>
              <p className="font-body text-xs md:text-sm text-[#4A7A5C] leading-relaxed font-light">
                Mapeie o ponto inicial, meio e cauda das sobrancelhas. Nossa IA analisa detalhadamente a densidade, espessura e saúde dos fios de forma automatizada.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#E8DECE]/40 border border-[#D4C9B5]/40 p-8 rounded-2xl space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#1C3A2B] text-[#E8DECE] flex items-center justify-center">
                <Eye size={20} />
              </div>
              <h3 className="font-heading text-lg font-medium text-[#1C3A2B]">Tricoscopia Capilar</h3>
              <p className="font-body text-xs md:text-sm text-[#4A7A5C] leading-relaxed font-light">
                Avalie profundamente a saúde da pele, descamação, óstios foliculares e identifique fios em desenvolvimento ou miniaturizados com precisão microscópica.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#E8DECE]/40 border border-[#D4C9B5]/40 p-8 rounded-2xl space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#1C3A2B] text-[#E8DECE] flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h3 className="font-heading text-lg font-medium text-[#1C3A2B]">Relatório Técnico em PDF</h3>
              <p className="font-body text-xs md:text-sm text-[#4A7A5C] leading-relaxed font-light">
                Gere um documento clínico elegante com a sua logo e cores para entregar à cliente, detalhando o diagnóstico e o objetivo do tratamento.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-[#E8DECE]/40 border border-[#D4C9B5]/40 p-8 rounded-2xl space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#1C3A2B] text-[#E8DECE] flex items-center justify-center">
                <Users size={20} />
              </div>
              <h3 className="font-heading text-lg font-medium text-[#1C3A2B]">Gestão de Clientes</h3>
              <p className="font-body text-xs md:text-sm text-[#4A7A5C] leading-relaxed font-light">
                Mantenha um histórico completo e organizado de todas as análises, fotos e evoluções de cada cliente cadastrada, acessível a qualquer momento.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Para quem é o ELHA */}
      <section className="bg-[#1C3A2B] text-[#E8DECE] py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <p className="font-label-category text-[10px] text-[#8FAF8A] tracking-[3px] uppercase">Público-Alvo</p>
            <h2 className="font-heading text-2xl md:text-4xl font-normal text-[#E8DECE]">Para quem é a plataforma?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4 border-l-2 border-[#4A7A5C] pl-6">
              <h3 className="font-heading text-xl font-medium text-[#E8DECE]">Designers de Sobrancelhas</h3>
              <p className="font-body text-xs md:text-sm text-[#8FAF8A] leading-relaxed font-light">
                Profissionais que desejam sair do básico e oferecer um atendimento personalizado, justificando um preço diferenciado através de relatórios visuais.
              </p>
            </div>

            <div className="space-y-4 border-l-2 border-[#4A7A5C] pl-6">
              <h3 className="font-heading text-xl font-medium text-[#E8DECE]">Micropigmentadoras</h3>
              <p className="font-body text-xs md:text-sm text-[#8FAF8A] leading-relaxed font-light">
                Especialistas que precisam avaliar a integridade da pele e dos fios antes de procedimentos invasivos, garantindo segurança e resultados duradouros.
              </p>
            </div>

            <div className="space-y-4 border-l-2 border-[#4A7A5C] pl-6">
              <h3 className="font-heading text-xl font-medium text-[#E8DECE]">Tricologistas</h3>
              <p className="font-body text-xs md:text-sm text-[#8FAF8A] leading-relaxed font-light">
                Clínicas e terapeutas capilares que realizam protocolos de reconstrução folicular e necessitam de acompanhamento técnico rigoroso e científico.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Final */}
      <section className="px-6 py-24 max-w-4xl mx-auto text-center space-y-8">
        <h2 className="font-heading text-3xl md:text-5xl font-normal text-[#1C3A2B] leading-tight">
          Pronta para elevar o nível do seu atendimento?
        </h2>
        <p className="font-body text-sm md:text-base text-[#4A7A5C] max-w-2xl mx-auto font-light leading-relaxed">
          Junte-se a centenas de especialistas que já transformaram seus estúdios em verdadeiras clínicas de referência em sobrancelhas.
        </p>
        <div className="pt-4">
          <button
            onClick={handleGoToApp}
            className="btn-elha-primary px-10 py-5 text-[11px] gap-2.5 shadow-lg shadow-[#1C3A2B]/10 hover:scale-105 transition-all inline-flex items-center"
          >
            Criar Minha Conta <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-[#D4C9B5]/30 py-16 px-6 bg-[#E8DECE]/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Logo className="w-9 h-9" />
              <span className="font-heading text-base font-medium tracking-[3px] uppercase text-[#1C3A2B]">ELHA</span>
            </div>
            <p className="font-body text-xs text-[#4A7A5C] font-light max-w-xs">
              A primeira plataforma de diagnóstico clínico e científico para especialistas em sobrancelhas.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <button
              onClick={handleGoToApp}
              className="text-xs text-[#1C3A2B] hover:underline font-medium"
            >
              Acessar App
            </button>
            <span className="text-xs text-[#4A7A5C] font-light">
              &copy; {new Date().getFullYear()} ELHA. Todos os direitos reservados.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;