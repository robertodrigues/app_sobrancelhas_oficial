import { useNavigate } from "react-router-dom";
import { Camera, CreditCard, FileText, Sparkles, Users, ChevronRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/auth";

const quickActions = [
  { label: "Captura", description: "Nova análise técnica", icon: Camera, path: "/captura" },
  { label: "Clientes", description: "Gerencie cadastros", icon: Users, path: "/clientes" },
  { label: "Edição", description: "Monte antes e depois", icon: FileText, path: "/edicao" },
  { label: "Créditos", description: "Veja seu saldo", icon: CreditCard, path: "/creditos" },
];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const displayName = user?.fullName || user?.firstName || "Especialista";

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] pb-24 md:pt-20">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6">
        <section className="mb-6 rounded-3xl bg-[#1C3A2B] px-5 py-6 text-[#E8DECE] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4A7A5C]/25 text-[#8FAF8A]">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[3px] text-[#8FAF8A]">
                Análise Inteligente
              </p>
              <h1 className="mt-1 text-2xl font-medium">Olá, {displayName}</h1>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#E8DECE]/85">
            Acesse rapidamente as principais áreas do sistema para capturar imagens, gerenciar clientes,
            criar montagens e acompanhar seus créditos.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.path}
                className="cursor-pointer border border-[#D4C9B5] bg-[#E8DECE] shadow-sm transition-transform hover:-translate-y-0.5"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1C3A2B] text-[#E8DECE]">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h2 className="font-medium text-[#1C3A2B]">{item.label}</h2>
                      <p className="text-xs text-[#4A7A5C]">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[#4A7A5C]" />
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="border border-[#D4C9B5] bg-[#E8DECE] shadow-sm">
            <CardContent className="p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[3px] text-[#4A7A5C]">
                Ação rápida
              </p>
              <h2 className="mt-2 text-lg font-medium text-[#1C3A2B]">Começar uma nova captura</h2>
              <p className="mt-2 text-sm text-[#4A7A5C]">
                Inicie uma análise com a câmera ou faça upload de uma imagem existente.
              </p>
              <Button className="btn-elha-primary mt-4 h-11 w-full" onClick={() => navigate("/captura")}>
                Ir para captura
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-[#D4C9B5] bg-[#E8DECE] shadow-sm">
            <CardContent className="p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[3px] text-[#4A7A5C]">
                Painel
              </p>
              <h2 className="mt-2 text-lg font-medium text-[#1C3A2B]">Organize seu fluxo de trabalho</h2>
              <p className="mt-2 text-sm text-[#4A7A5C]">
                Gerencie clientes, acompanhe resultados e mantenha seus relatórios prontos.
              </p>
              <Button className="btn-elha-outline mt-4 h-11 w-full" onClick={() => navigate("/clientes")}>
                Ver clientes
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Index;