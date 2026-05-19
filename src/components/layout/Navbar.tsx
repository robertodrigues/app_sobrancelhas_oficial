import { Link, useLocation } from 'react-router-dom';
import { Camera, Users, LayoutDashboard, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 px-6 py-3 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="max-w-md mx-auto flex justify-between items-center md:max-w-4xl">
        <Link to="/" className={cn(
          "flex flex-col items-center gap-1 transition-all duration-300",
          isActive('/') ? "text-accent scale-110" : "text-slate-400 hover:text-slate-600"
        )}>
          <LayoutDashboard size={22} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">Início</span>
        </Link>

        <Link to="/clientes" className={cn(
          "flex flex-col items-center gap-1 transition-all duration-300",
          isActive('/clientes') ? "text-accent scale-110" : "text-slate-400 hover:text-slate-600"
        )}>
          <Users size={22} strokeWidth={isActive('/clientes') ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">Clientes</span>
        </Link>

        <div className="relative -top-6 md:top-0">
          <Link 
            to="/captura" 
            className="flex items-center justify-center w-14 h-14 bg-accent text-white rounded-full shadow-lg shadow-accent/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Camera size={28} />
          </Link>
        </div>

        <Link to="/relatorios" className={cn(
          "flex flex-col items-center gap-1 transition-all duration-300",
          isActive('/relatorios') ? "text-accent scale-110" : "text-slate-400 hover:text-slate-600"
        )}>
          <Sparkles size={22} strokeWidth={isActive('/relatorios') ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">Análises</span>
        </Link>

        <div className="hidden md:block w-6 h-6"></div>
      </div>
    </nav>
  );
};

export default Navbar;