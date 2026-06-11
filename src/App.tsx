import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HybridAuthProvider, SignedIn, SignedOut, RedirectToSignIn } from "@/lib/auth";
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

const queryClient = new QueryClient();

const App = () => {
  return (
    <HybridAuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-[100dvh] bg-[#D8D1C6] md:flex md:items-center md:justify-center md:p-4">
            <div className="relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-[#F6F0E8] text-[#1C3A2B] md:h-[calc(100dvh-2rem)] md:max-w-[430px] md:rounded-[32px] md:shadow-[0_25px_80px_rgba(0,0,0,0.18)] md:ring-1 md:ring-black/5">
              <BrowserRouter>
                <Routes>
                  {/* Rotas Públicas */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Rotas Protegidas por Autenticação */}
                  <Route path="/" element={
                    <>
                      <SignedIn><Index /></SignedIn>
                      <SignedOut><RedirectToSignIn /></SignedOut>
                    </>
                  } />
                  <Route path="/captura" element={
                    <>
                      <SignedIn><Capture /></SignedIn>
                      <SignedOut><RedirectToSignIn /></SignedOut>
                    </>
                  } />
                  <Route path="/clientes" element={
                    <>
                      <SignedIn><Clients /></SignedIn>
                      <SignedOut><RedirectToSignIn /></SignedOut>
                    </>
                  } />
                  <Route path="/novo-cliente" element={
                    <>
                      <SignedIn><NewClient /></SignedIn>
                      <SignedOut><RedirectToSignIn /></SignedOut>
                    </>
                  } />
                  <Route path="/resultado" element={
                    <>
                      <SignedIn><AnalysisResult /></SignedIn>
                      <SignedOut><RedirectToSignIn /></SignedOut>
                    </>
                  } />
                  <Route path="/creditos" element={
                    <>
                      <SignedIn><Credits /></SignedIn>
                      <SignedOut><RedirectToSignIn /></SignedOut>
                    </>
                  } />
                  <Route path="/edicao" element={
                    <>
                      <SignedIn><Edition /></SignedIn>
                      <SignedOut><RedirectToSignIn /></SignedOut>
                    </>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </div>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </HybridAuthProvider>
  );
};

export default App;