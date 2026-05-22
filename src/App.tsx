import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Capture from "./pages/Capture";
import Clients from "./pages/Clients";
import NewClient from "./pages/NewClient";
import AnalysisResult from "./pages/AnalysisResult";
import NotFound from "./pages/NotFound";
import Credits from "./pages/Credits";
import Edition from "./pages/Edition"; // Adicione esta linha

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/captura" element={<Capture />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/novo-cliente" element={<NewClient />} />
          <Route path="/resultado" element={<AnalysisResult />} />
          <Route path="/creditos" element={<Credits />} />
          <Route path="/edicao" element={<Edition />} /> {/* Adicione esta linha */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;