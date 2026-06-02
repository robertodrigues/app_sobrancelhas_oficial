import { Link, useLocation } from 'react-router-dom';
import { Camera, Users, LayoutDashboard, Paintbrush, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed inset-x-0 bottom-3 z-50 px-3 pb-[env(safe-area-inset-bottom)] md:bottom-4">
      <div className="mx-auto grid max-w-[430px] grid-cols-5 items-center rounded-[28px] border border-[#4A7A5C]/25 bg-[#1C3A2B]/95 px-2 py-2 shadow-[0_18px_45px_rgba(28,58,43,0.28)] backdrop-blur-xl">
        <Link
          to="/"
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all duration-300",
            isActive('/') ? "bg-white/8 text-[#8FAF8A]" : "text-[#D4C9B5] hover:text-[#E8DECE]"
          )}
        >
          <LayoutDashboard size={20} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[9px] font-medium tracking-[1px] uppercase">Início</span>
        </Link>

        <Link
          to="/clientes"
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all duration-300",
            isActive('/clientes') ? "bg-white/8 text-[#8FAF8A]" : "text-[#D4C9B5] hover:text-[#E8DECE]"
          )}
        >
          <Users size={20} strokeWidth={isActive('/clientes') ? 2.5 : 2} />
          <span className="text-[9px] font-medium tracking-[1px] uppercase">Clientes</span>
        </Link>

        <div className="flex justify-center relative">
          <Link 
            to="/captura" 
            className="absolute -top-8 flex items-center justify-center w-16 h-16 bg-[#4A7A5C] text-[#E8DECE] rounded-full shadow-2xl shadow-[#1C3A2B]/40 hover:scale-105 active:scale-95 transition-all border-4 border-[#F6F0E8] md:relative md:top-0 md:w-14 md:h-14"
          >
            <Camera size={26} />
          </Link>
        </div>

        <Link
          to="/edicao"
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all duration-300",
            isActive('/edicao') ? "bg-white/8 text-[#8FAF8A]" : "text-[#D4C9B5] hover:text-[#E8DECE]"
          )}
        >
          <Paintbrush size={20} strokeWidth={isActive('/edicao') ? 2.5 : 2} />
          <span className="text-[9px] font-medium tracking-[1px] uppercase">Edição</span>
        </Link>

        <Link
          to="/creditos"
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all duration-300",
            isActive('/creditos') ? "bg-white/8 text-[#8FAF8A]" : "text-[#D4C9B5] hover:text-[#E8DECE]"
          )}
        >
          <CreditCard size={20} strokeWidth={isActive('/creditos') ? 2.5 : 2} />
          <span className="text-[9px] font-medium tracking-[1px] uppercase">Créditos</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;