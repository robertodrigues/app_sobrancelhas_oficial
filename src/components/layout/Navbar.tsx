import { Link, useLocation } from 'react-router-dom';
import { Camera, Users, LayoutDashboard, Paintbrush, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1C3A2B]/95 backdrop-blur-xl border-t border-[#4A7A5C]/50 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="max-w-lg mx-auto grid grid-cols-5 items-center h-20 md:h-16">
        
        {/* Início */}
        <Link to="/" className={cn(
          "flex flex-col items-center justify-center gap-1 transition-all duration-300",
          isActive('/') ? "text-[#8FAF8A]" : "text-[#D4C9B5] hover:text-[#E8DECE]"
        )}>
          <LayoutDashboard size={20} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[9px] font-medium tracking-[1px] uppercase">Início</span>
        </Link>

        {/* Clientes */}
        <Link to="/clientes" className={cn(
          "flex flex-col items-center justify-center gap-1 transition-all duration-300",
          isActive('/clientes') ? "text-[#8FAF8A]" : "text-[#D4C9B5] hover:text-[#E8DECE]"
        )}>
          <Users size={20} strokeWidth={isActive('/clientes') ? 2.5 : 2} />
          <span className="text-[9px] font-medium tracking-[1px] uppercase">Clientes</span>
        </Link>

        {/* Botão Central de Captura */}
        <div className="flex justify-center relative">
          <Link 
            to="/captura" 
            className="absolute -top-10 flex items-center justify-center w-16 h-16 bg-[#4A7A5C] text-[#E8DECE] rounded-full shadow-2xl shadow-[#1C3A2B]/50 hover:scale-105 active:scale-95 transition-all border-4 border-[#1C3A2B] md:relative md:top-0 md:w-12 md:h-12"
          >
            <Camera size={26} />
          </Link>
        </div>

        {/* Edição */}
        <Link to="/edicao" className={cn(
          "flex flex-col items-center justify-center gap-1 transition-all duration-300",
          isActive('/edicao') ? "text-[#8FAF8A]" : "text-[#D4C9B5] hover:text-[#E8DECE]"
        )}>
          <Paintbrush size={20} strokeWidth={isActive('/edicao') ? 2.5 : 2} />
          <span className="text-[9px] font-medium tracking-[1px] uppercase">Edição</span>
        </Link>

        {/* Créditos */}
        <Link to="/creditos" className={cn(
          "flex flex-col items-center justify-center gap-1 transition-all duration-300",
          isActive('/creditos') ? "text-[#8FAF8A]" : "text-[#D4C9B5] hover:text-[#E8DECE]"
        )}>
          <CreditCard size={20} strokeWidth={isActive('/creditos') ? 2.5 : 2} />
          <span className="text-[9px] font-medium tracking-[1px] uppercase">Créditos</span>
        </Link>

      </div>
    </nav>
  );
};

export default Navbar;