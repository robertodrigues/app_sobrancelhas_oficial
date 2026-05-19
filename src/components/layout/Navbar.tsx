import { Link, useLocation } from 'react-router-dom';
import { Camera, Users, LayoutDashboard, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="max-w-lg mx-auto grid grid-cols-5 items-center h-20 md:h-16">
        
        {/* Início */}
        <Link to="/" className={cn(
          "flex flex-col items-center justify-center gap-1 transition-all duration-300",
          isActive('/') ? "text-accent" : "text-slate-400 hover:text-slate-600"
        )}>
          <LayoutDashboard size={22} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Início</span>
        </Link>

        {/* Clientes */}
        <Link to="/clientes" className={cn(
          "flex flex-col items-center justify-center gap-1 transition-all duration-300",
          isActive('/clientes') ? "text-accent" : "text-slate-400 hover:text-slate-600"
        )}>
          <Users size={22} strokeWidth={isActive('/clientes') ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Clientes</span>
        </Link>

        {/* Botão Central de Captura */}
        <div className="flex justify-center relative">
          <Link 
            to="/captura" 
            className="absolute -top-10 flex items-center justify-center w-16 h-16 bg-accent text-white rounded-full shadow-2xl shadow-accent/40 hover:scale-105 active:scale-95 transition-all border-4 border-white md:relative md:top-0 md:w-12 md:h-12"
          >
            <Camera size={28} className="md:size-20" />
          </Link>
        </div>

        {/* Análises */}
        <Link to="/relatorios" className={cn(
          "flex flex-col items-center justify-center gap-1 transition-all duration-300",
          isActive('/relatorios') ? "text-accent" : "text-slate-400 hover:text-slate-600"
        )}>
          <Sparkles size={22} strokeWidth={isActive('/relatorios') ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Análises</span>
        </Link>

        {/* Perfil ou Config (Placeholder para manter simetria) */}
        <div className="flex flex-col items-center justify-center gap-1 text-slate-400 opacity-50">
          <div className="w-6 h-6 rounded-full bg-slate-200" />
          <span className="text-[10px] font-bold">Perfil</span>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;