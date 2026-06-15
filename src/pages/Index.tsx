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

      <main className="mx-auto w-full max-w-md px-4 py-6">
        <section className="mb-6 rounded-3xl bg-[#E8DECE] p-6 shadow-sm border border-[#D4C9B5] text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1C3A2B] text-[#E8DECE]">
            <Sparkles size={24} />
          </div>

          <p className="font-label-category text-[10px] text-[#4A7A5C]">Bem-vinda</p>
          <h1 className="mt-2 text-2xl font-heading text-[#1C3A2B]">Olá, {displayName}</h1>
          <p className="mt-3 text-sm font-body text-[#4A7A5C]">
            Acesse rapidamente as principais áreas do sistema.
          </p>

          <Button className="btn-elha-primary mt-5 h-12 w-full" onClick={() => navigate("/captura")}>
            Começar captura
          </Button>
        </section>

        <section className="space-y-3">
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

        <section className="mt-6 grid gap-4">
          <Card className="border border-[#D4C9B5] bg-[#E8DECE] shadow-sm">
            <CardContent className="p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[3px] text-[#4A7A5C]">
                Ação rápida
              </p>
              <h2 className="mt-2 text-lg font-medium text-[#1C3A2B]">Nova análise técnica</h2>
              <p className="mt-2 text-sm text-[#4A7A5C]">
                Faça uma nova captura para iniciar o diagnóstico.
              </p>
              <Button className="btn-elha-primary mt-4 h-11 w-full" onClick={() => navigate("/captura")}>
                Ir para captura
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-[#D4C9B5] bg-[#E8DECE] shadow-sm">
            <CardContent className="p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[3px] text-[#4A7A5C]">
                Organização
              </p>
              <h2 className="mt-2 text-lg font-medium text-[#1C3A2B]">Gerencie seus clientes</h2>
              <p className="mt-2 text-sm text-[#4A7A5C]">
                Acesse a lista de clientes e mantenha tudo em ordem.
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