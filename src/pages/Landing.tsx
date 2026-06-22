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
  Eye,
  Instagram,
} from "lucide-react";
import Logo from "@/components/ui/Logo";

const Landing = () => {
  const handleGoToApp = () => {
    window.location.href = "https://app.elha.com.br/register";
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F5F0E8] font-sans text-[#1C3A2B] selection:bg-[#1C3A2B] selection:text-[#E8DECE]">
      <header className="sticky top-0 z-50 border-b border-[#D4C9B5]/30 bg-[#F5F0E8]/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10" />
            <span className="font-heading text-lg font-medium uppercase tracking-[4px] text-[#1C3A2B]">
              ELHA
            </span>
          </div>
          <button
            onClick={handleGoToApp}
            className="btn-elha-primary px-6 py-3 text-[10px] shadow-md transition-all hover:scale-105"
          >
            Acessar App
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-8 px-6 py-20 text-center md:py-32">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF3DE] px-5 py-2 text-[10px] font-bold uppercase tracking-[2px] text-[#3B6D11] font-label-category">
          <Sparkles size={12} /> Análise Inteligente
        </div>

        <h1 className="mx-auto max-w-4xl font-heading text-3xl font-normal leading-tight text-[#1C3A2B] md:text-5xl">
          Transforme cada atendimento de Reconstrução de Sobrancelha em uma{" "}
          <span className="font-medium">análise tricológica inteligente e documentada</span>
        </h1>

        <p className="mx-auto max-w-2xl font-body text-sm font-light leading-relaxed text-[#4A7A5C] md:text-base">
          O primeiro app com inteligência tricológica para sobrancelhas. Análise detalhada, relatório personalizado e resultado que a sua cliente consegue ver.
        </p>

        <div className="pt-4">
          <button
            onClick={handleGoToApp}
            className="btn-elha-primary inline-flex items-center gap-2.5 px-10 py-5 text-[11px] shadow-lg shadow-[#1C3A2B]/10 transition-all hover:scale-105"
          >
            Começar Agora <ArrowRight size={14} />
          </button>
        </div>
      </section>

      <section className="border-y border-[#D4C9B5]/50 bg-[#E8DECE] px-6 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
          <div className="space-y-6">
            <p className="font-label-category text-[10px] uppercase tracking-[3px] text-[#4A7A5C]">
              A Evolução do Mercado
            </p>
            <h2 className="font-heading text-2xl font-normal leading-tight text-[#1C3A2B] md:text-4xl">
              O design de sobrancelhas deixou de ser apenas intuitivo
            </h2>
            <p className="font-body text-sm font-light leading-relaxed text-[#4A7A5C] text-justify">
              Na avaliação, a profissional sabe o que precisa melhorar na sobrancelha da
              cliente só que tem dificuldade em ser detalhista. Quais fios precisam ganhar
              espessura? Em qual região a densidade está comprometida? Onde o
              crescimento precisa ser estimulado? Na evolução, só fica na foto do antes e
              depois mostrando que mudou, mas não explica o quanto. Sem uma
              ferramenta de análise, essas informações ficam na cabeça e o atendimento perde a profundidade.
              O mercado evoluiu, e a profissional que hoje trabalha com tratamento de reconstrução precisa
              detalhar o que vê, comunicar o que planeja e comprovar o que entregou.
            </p>
            <p className="font-body text-sm font-medium leading-relaxed text-[#1C3A2B] text-justify">
              A Elha veio para mudar essa realidade, traduzindo o olhar tricológico em
              dados técnicos e visuais, ela gera autoridade imediata e um diferencial
              competitivo que nenhuma outra ferramenta do mercado entrega hoje.
            </p>
          </div>

          <div className="relative flex justify-center">
            <div className="w-full max-w-md space-y-6 rounded-3xl border border-[#D4C9B5] bg-[#F5F0E8] p-8 shadow-xl">
              <div className="flex items-center gap-4 border-b border-[#D4C9B5]/40 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C3A2B]/10 text-[#1C3A2B]">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="font-heading text-sm font-medium text-[#1C3A2B]">Relatório Técnico</p>
                  <p className="text-[10px] text-[#4A7A5C]">Valorização profissional</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#3B6D11]" />
                  <span className="text-xs text-[#1C3A2B]/90 md:text-sm">
                    Mapeamento preciso de densidade e espessura
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#3B6D11]" />
                  <span className="text-xs text-[#1C3A2B]/90 md:text-sm">
                    Comprovação visual de evolução técnica
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#3B6D11]" />
                  <span className="text-xs text-[#1C3A2B]/90 md:text-sm">
                    Fidelização baseada em dados reais e relatórios
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-16 px-6 py-24">
        <div className="space-y-3 text-center">
          <p className="font-label-category text-[10px] uppercase tracking-[3px] text-[#4A7A5C]">
            tecnologia de análise tricológica
          </p>
          <h2 className="font-heading text-2xl font-normal text-[#1C3A2B] md:text-4xl">
            Desenvolvido para a sua rotina de atendimento
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-2xl border border-[#D4C9B5]/40 bg-[#E8DECE]/40 p-8 space-y-4 transition-all hover:shadow-md">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C3A2B] text-[#E8DECE]">
                <Camera size={20} />
              </div>
              <h3 className="font-heading text-lg font-medium text-[#1C3A2B]">
                Análise com Inteligência Artificial
              </h3>
              <p className="font-body text-xs leading-relaxed text-[#4A7A5C] font-light md:text-sm">
                Mapeie o ponto inicial, meio e cauda das sobrancelhas. Nossa IA analisa detalhadamente a densidade, espessura e saúde dos fios de forma automatizada.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[#D4C9B5]/40 bg-[#E8DECE]/40 p-8 space-y-4 transition-all hover:shadow-md">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C3A2B] text-[#E8DECE]">
                <Eye size={20} />
              </div>
              <h3 className="font-heading text-lg font-medium text-[#1C3A2B]">
                Tricoscopia de Sobrancelhas
              </h3>
              <p className="font-body text-xs leading-relaxed text-[#4A7A5C] font-light md:text-sm">
                Avalie profundamente a saúde da pele, descamação, óstios foliculares e identifique fios em desenvolvimento ou miniaturizados com precisão.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[#D4C9B5]/40 bg-[#E8DECE]/40 p-8 space-y-4 transition-all hover:shadow-md">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C3A2B] text-[#E8DECE]">
                <FileText size={20} />
              </div>
              <h3 className="font-heading text-lg font-medium text-[#1C3A2B]">Relatório Técnico</h3>
              <p className="font-body text-xs leading-relaxed text-[#4A7A5C] font-light md:text-sm">
                Gere um documento clínico elegante com a sua logo e cores para entregar à cliente, detalhando o relatório técnico e o objetivo do tratamento.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[#D4C9B5]/40 bg-[#E8DECE]/40 p-8 space-y-4 transition-all hover:shadow-md">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C3A2B] text-[#E8DECE]">
                <Users size={20} />
              </div>
              <h3 className="font-heading text-lg font-medium text-[#1C3A2B]">Gestão de Clientes</h3>
              <p className="font-body text-xs leading-relaxed text-[#4A7A5C] font-light md:text-sm">
                Mantenha um histórico completo e organizado de todas as análises, fotos e evoluções de cada cliente cadastrada, acessível a qualquer momento.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#1C3A2B] px-6 py-24 text-[#E8DECE]">
        <div className="mx-auto max-w-6xl space-y-16">
          <div className="space-y-3 text-center">
            <p className="font-label-category text-[10px] uppercase tracking-[3px] text-[#8FAF8A]">
              Para quem é o Elha
            </p>
            <h2 className="mx-auto max-w-3xl font-heading text-2xl font-normal leading-tight text-[#E8DECE] md:text-4xl">
              Para toda profissional que trabalha com tratamento e reconstrução de sobrancelhas e quer ir além da foto do antes e depois. Designer, micropigmentadora ou tricologista, se o seu foco é tratar e comprovar resultado, a Elha foi desenvolvida para você.
            </h2>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-8 px-6 py-24 text-center">
        <h2 className="font-heading text-3xl font-normal leading-tight text-[#1C3A2B] md:text-5xl">
          Pronta para elevar o nível do seu atendimento?
        </h2>
        <p className="mx-auto max-w-2xl font-body text-sm font-light leading-relaxed text-[#4A7A5C] md:text-base">
          Seu conhecimento vale muito mais do que uma foto de antes e depois. Está na hora de documentar isso. Crie sua conta e faça sua primeira análise hoje.
        </p>
        <div className="pt-4">
          <button
            onClick={handleGoToApp}
            className="btn-elha-primary inline-flex items-center gap-2.5 px-10 py-5 text-[11px] shadow-lg shadow-[#1C3A2B]/10 transition-all hover:scale-105"
          >
            Criar Minha Conta <ArrowRight size={14} />
          </button>
        </div>
      </section>

      <footer className="border-t border-[#D4C9B5]/30 bg-[#E8DECE]/20 px-6 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <Logo className="h-9 w-9" />
              <span className="font-heading text-base font-medium uppercase tracking-[3px] text-[#1C3A2B]">
                ELHA
              </span>
            </div>
            <p className="font-body text-xs font-light text-[#4A7A5C] max-w-xs">
              A primeira plataforma de diagnóstico clínico e científico para especialistas em sobrancelhas.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 md:flex-row">
            <a
              href="https://www.instagram.com/elhaapp"
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir Instagram da ELHA"
              className="inline-flex items-center justify-center rounded-full border border-[#D4C9B5] bg-[#F5F0E8] p-3 text-[#1C3A2B] transition-transform hover:scale-105 hover:bg-[#E8DECE]"
            >
              <Instagram size={18} />
            </a>
            <div className="space-y-1 text-xs font-medium text-[#1C3A2B] md:text-right">
              <p>Pagamentos por Mercado Pago</p>
            </div>
            <button
              onClick={handleGoToApp}
              className="text-xs font-medium text-[#1C3A2B] hover:underline"
            >
              Acessar App
            </button>
            <span className="text-xs font-light text-[#4A7A5C]">
              &copy; {new Date().getFullYear()} ELHA. Todos os direitos reservados.
            </span>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-6xl border-t border-[#D4C9B5]/40 pt-8">
          <div className="grid gap-8 text-left md:grid-cols-3">
            <div className="space-y-3">
              <h3 className="font-label-category text-[10px] tracking-[3px] text-[#1C3A2B]">
                Sobre nós
              </h3>
              <div className="space-y-2 text-sm text-[#4A7A5C]">
                <p>Sobre nós</p>
                <p>Sobre a transfereIA</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-label-category text-[10px] tracking-[3px] text-[#1C3A2B]">
                Contato
              </h3>
              <div className="space-y-2 text-sm text-[#4A7A5C]">
                <p>Fale Conosco</p>
                <p>contato@elha.com.br</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-label-category text-[10px] tracking-[3px] text-[#1C3A2B]">
                Políticas
              </h3>
              <div className="space-y-2 text-sm text-[#4A7A5C]">
                <p>Política de privacidade</p>
                <p>Termos de uso</p>
                <p>Política de reembolso</p>
                <p>Lei LGPD</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;