import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, FileText, Camera, Sparkles, Loader2, ChevronRight, LogOut, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useUser, useClerk } from "@/lib/auth";
import { showSuccess, showError } from "@/utils/toast";

const Index = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [stats, setStats] = useState({ clients: 0, analyses: 0 });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "Especialista";

  useEffect(() => {
    if (user?.id) {
      const savedAvatar = localStorage.getItem(`elha_user_avatar_${user.id}`);
      if (savedAvatar) {
        setCustomAvatar(savedAvatar);
      } else {
        setCustomAvatar(null);
      }
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);

    const fetchData = async () => {
      setLoading(true);
      try {
        if (!user?.id) {
          setStats({ clients: 0, analyses: 0 });
          setRecentActivities([]);
          return;
        }

        const { count: clientCount, error: clientError } = await supabase
          .from("clients")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (clientError && (
          clientError.message.includes("user_id") ||
          clientError.code === "PGRST204" ||
          clientError.message.includes("column")
        )) {
          setStats({ clients: 0, analyses: 0 });
          setRecentActivities([]);
          return;
        }

        const { count: analysisCount, error: analysisError } = await supabase
          .from("analyses")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (analysisError && (
          analysisError.message.includes("user_id") ||
          analysisError.code === "PGRST204" ||
          analysisError.message.includes("column")
        )) {
          setStats({ clients: 0, analyses: 0 });
          setRecentActivities([]);
          return;
        }

        const { data: recent, error: recentError } = await supabase
          .from("analyses")
          .select("*, clients(name)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (recentError && (
          recentError.message.includes("user_id") ||
          recentError.code === "PGRST204" ||
          recentError.message.includes("column")
        )) {
          setStats({ clients: 0, analyses: 0 });
          setRecentActivities([]);
          return;
        }

        setStats({ clients: clientCount || 0, analyses: analysisCount || 0 });
        setRecentActivities(recent || []);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setStats({ clients: 0, analyses: 0 });
        setRecentActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [user?.id]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCustomAvatar(base64);
      if (user?.id) {
        localStorage.setItem(`elha_user_avatar_${user.id}`, base64);
      }
      showSuccess("Foto de perfil atualizada com sucesso!");
      setMenuOpen(false);
    };
    reader.onerror = () => {
      showError("Erro ao carregar a imagem.");
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      showSuccess("Sessão encerrada com sucesso!");
      navigate("/login");
    } catch (error) {
      showError("Erro ao sair da conta.");
    }
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-[#F6F0E8] z-50 flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-center space-y-4"
            >
              <img
                src="/elha-logo.png"
                alt="ELHA"
                className="mx-auto h-40 w-40 object-contain"
              />
              <p className="font-body text-[11px] font-light text-[#4A7A5C] tracking-[4px] uppercase">
                Análise Inteligente
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#F6F0E8] text-[#1C3A2B] pb-28 md:pt-20">
        <Navbar />
        <main className="max-w-4xl mx-auto p-6">
          <header className="mb-8 flex flex-col items-center text-center relative pt-4">
            <div className="relative mb-3" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-14 h-14 rounded-full bg-[#8FAF8A]/10 border-2 border-[#4A7A5C]/20 flex items-center justify-center text-[#8FAF8A] overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                {customAvatar ? (
                  <img src={customAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Sparkles size={24} />
                )}
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-16 left-1/2 -translate-x-1/2 w-48 bg-[#E8DECE] border border-[#D4C9B5] rounded-2xl shadow-xl p-2 z-50 space-y-1"
                  >
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-[#1C3A2B] hover:bg-[#F5F0E8] rounded-xl transition-colors text-left"
                    >
                      <Upload size={14} className="text-[#4A7A5C]" />
                      <span>Alterar Foto/Logo</span>
                    </button>

                    <div className="h-px bg-[#D4C9B5] my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                    >
                      <LogOut size={14} />
                      <span>Sair</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <h1 className="font-heading text-3xl font-normal text-[#1C3A2B] tracking-[1px]">
              Olá, {firstName}
            </h1>
            <p className="font-body text-xs text-[#8FAF8A] font-light tracking-[1px] uppercase mt-1">
              Pronta para transformar olhares?
            </p>
          </header>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-none shadow-sm bg-[#3D6B52] rounded-2xl">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-[#1C3A2B]/30 flex items-center justify-center mb-3 mx-auto">
                    <Users className="h-5 w-5 text-[#8FAF8A]" />
                  </div>
                  <div className="font-heading text-3xl font-medium text-[#E8DECE] text-center">
                    {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto text-[#8FAF8A]" /> : stats.clients}
                  </div>
                  <p className="font-label-category text-[10px] font-medium text-[#8FAF8A] text-center mt-1">
                    Clientes
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-none shadow-sm bg-[#3D6B52] rounded-2xl">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-[#1C3A2B]/30 flex items-center justify-center mb-3 mx-auto">
                    <FileText className="h-5 w-5 text-[#8FAF8A]" />
                  </div>
                  <div className="font-heading text-3xl font-medium text-[#E8DECE] text-center">
                    {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto text-[#8FAF8A]" /> : stats.analyses}
                  </div>
                  <p className="font-label-category text-[10px] font-medium text-[#8FAF8A] text-center mt-1">
                    Análises
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <section className="mb-8">
            <h2 className="font-label-category text-xs font-medium text-[#8FAF8A] mb-4 text-center">
              Ações Rápidas
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Button asChild variant="ghost" className="h-32 flex flex-col gap-3 bg-[#E8DECE] text-[#1C3A2B] border-none shadow-sm rounded-2xl hover:bg-[#E8DECE]/90 transition-all group">
                <Link to="/novo-cliente">
                  <div className="w-12 h-12 rounded-full bg-[#1C3A2B]/10 flex items-center justify-center group-hover:bg-[#1C3A2B] group-hover:text-[#E8DECE] transition-colors">
                    <Plus size={24} className="text-[#1C3A2B] group-hover:text-[#E8DECE]" />
                  </div>
                  <span className="font-body font-medium text-xs tracking-[1px] uppercase">Novo Cliente</span>
                </Link>
              </Button>

              <Button asChild variant="ghost" className="h-32 flex flex-col gap-3 bg-[#3D6B52] text-[#E8DECE] border border-[#4A7A5C] shadow-sm rounded-2xl hover:bg-[#3D6B52]/90 transition-all group">
                <Link to="/captura">
                  <div className="w-12 h-12 rounded-full bg-[#1C3A2B]/30 flex items-center justify-center group-hover:bg-[#8FAF8A] group-hover:text-[#1C3A2B] transition-colors">
                    <Camera size={24} className="text-[#E8DECE] group-hover:text-[#1C3A2B]" />
                  </div>
                  <span className="font-body font-medium text-xs tracking-[1px] uppercase">Nova Captura</span>
                </Link>
              </Button>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-label-category text-xs font-medium text-[#8FAF8A]">
                Atividades Recentes
              </h2>
              <Button variant="link" className="text-[#8FAF8A] hover:text-[#1C3A2B] font-medium text-xs tracking-[1px] uppercase">
                Ver tudo
              </Button>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-[#8FAF8A]" />
                </div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 bg-[#E8DECE] text-[#1C3A2B] rounded-2xl shadow-sm border border-[#D4C9B5] cursor-pointer hover:bg-[#E8DECE]/90 transition-colors"
                    onClick={() => navigate("/resultado", { state: { analysis: activity.result, image: activity.image_url } })}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#D4C9B5]">
                        <img src={activity.image_url} alt="Análise" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-heading text-sm font-medium text-[#1C3A2B]">{activity.clients?.name || "Cliente"}</h4>
                        <p className="font-body text-[10px] text-[#4A7A5C] font-medium uppercase tracking-[1px]">
                          {new Date(activity.created_at).toLocaleDateString("pt-BR")} às {new Date(activity.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-[#4A7A5C]" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-[#3D6B52]/30 rounded-2xl border border-dashed border-[#4A7A5C]">
                  <p className="font-body text-sm text-[#8FAF8A]">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default Index;