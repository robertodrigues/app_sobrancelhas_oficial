import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HybridAuthProvider, SignedIn, SignedOut, RedirectToSignIn } from "@/lib/auth";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Capture from "./pages/Capture";
import Clients from "./pages/Clients";
import NewClient from "./pages/NewClient";
import AnalysisResult from "./pages/AnalysisResult";
import NotFound from "./pages/NotFound";
import Credits from "./pages/Credits";
import Edition from "./pages/Edition";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import TechnicalMapping from "./pages/TechnicalMapping";

const queryClient = new QueryClient();

// Componente para gerenciar o redirecionamento de subdomínio e renderização da Home
const HomeRouter = () => {
  const hostname = window.location.hostname;
  
  // Se for o domínio principal institucional, renderiza a Landing Page
  const isLandingDomain = hostname === "elha.com.br" || hostname === "www.elha.com.br";

  if (isLandingDomain) {
    return <Landing />;
  }

  // Caso contrário (app.elha.com.br, localhost ou preview do Dyad), renderiza o App Dashboard
  return (
    <>
      <SignedIn><Index /></SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  );
};

// Componente de proteção para garantir que rotas do App no domínio principal sejam redirecionadas para o subdomínio app
const AppRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const hostname = window.location.hostname;
  const isLandingDomain = hostname === "elha.com.br" || hostname === "www.elha.com.br";

  useEffect(() => {
    if (isLandingDomain) {
      // Redireciona de www.elha.com.br/rota para app.elha.com.br/rota
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `https://app.elha.com.br${currentPath}`;
    }
  }, [isLandingDomain]);

  if (isLandingDomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin h-8 w-8 mx-auto text-[#1C3A2B]" />
          <p className="text-xs text-[#4A7A5C]">Redirecionando para a plataforma segura...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Componente para gerenciar o layout responsivo (Full Width para Landing Page, Mobile Frame para o App)
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isLanding, setIsLanding] = useState(false);

  useEffect(() => {
    const checkPath = () => {
      const hostname = window.location.hostname;
      const path = window.location.pathname;
      const isLandingDomain = hostname === "elha.com.br" || hostname === "www.elha.com.br";
      setIsLanding(path === "/institucional" || isLandingDomain);
    };

    checkPath();
    // Monitora mudanças de rota para atualizar o layout
    window.addEventListener("popstate", checkPath);
    return () => window.removeEventListener("popstate", checkPath);
  }, []);

  if (isLanding) {
    return (
      <div className="min-h-screen w-full bg-[#F5F0E8] text-[#1C3A2B]">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#D8D1C6] md:flex md:items-center md:justify-center md:p-4">
      <div className="relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-[#F6F0E8] text-[#1C3A2B] md:h-[calc(100dvh-2rem)] md:max-w-[430px] md:rounded-[32px] md:shadow-[0_25px_80px_rgba(0,0,0,0.18)] md:ring-1 md:ring-black/5">
        {children}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <HybridAuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <LayoutWrapper>
              <Routes>
                {/* Rotas Públicas */}
                <Route path="/login" element={<AppRouteGuard><Login /></AppRouteGuard>} />
                <Route path="/register" element={<AppRouteGuard><Register /></AppRouteGuard>} />

                {/* Rota de Visualização da Landing Page no Preview */}
                <Route path="/institucional" element={<Landing />} />

                {/* Rota Principal (Decide entre Landing Page ou App Dashboard) */}
                <Route path="/" element={<HomeRouter />} />

                {/* Rotas Protegidas por Autenticação */}
                <Route path="/captura" element={
                  <AppRouteGuard>
                    <SignedIn><Capture /></SignedIn>
                    <SignedOut><RedirectToSignIn /></SignedOut>
                  </AppRouteGuard>
                } />
                <Route path="/mapeamento-tecnico" element={
                  <AppRouteGuard>
                    <SignedIn><TechnicalMapping /></SignedIn>
                    <SignedOut><RedirectToSignIn /></SignedOut>
                  </AppRouteGuard>
                } />
                <Route path="/clientes" element={
                  <AppRouteGuard>
                    <SignedIn><Clients /></SignedIn>
                    <SignedOut><RedirectToSignIn /></SignedOut>
                  </AppRouteGuard>
                } />
                <Route path="/novo-cliente" element={
                  <AppRouteGuard>
                    <SignedIn><NewClient /></SignedIn>
                    <SignedOut><RedirectToSignIn /></SignedOut>
                  </AppRouteGuard>
                } />
                <Route path="/resultado" element={<AppRouteGuard><AnalysisResult /></AppRouteGuard>} />
                <Route path="/creditos" element={
                  <AppRouteGuard>
                    <SignedIn><Credits /></SignedIn>
                    <SignedOut><RedirectToSignIn /></SignedOut>
                  </AppRouteGuard>
                } />
                <Route path="/edicao" element={
                  <AppRouteGuard>
                    <SignedIn><Edition /></SignedIn>
                    <SignedOut><RedirectToSignIn /></SignedOut>
                  </AppRouteGuard>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </LayoutWrapper>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HybridAuthProvider>
  );
};

import { Loader2 } from "lucide-react";

export default App;