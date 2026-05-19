import { Link } from 'react-router-dom';
import { Camera, Users, LayoutDashboard, Sparkles } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="max-w-md mx-auto flex justify-between items-center md:max-w-4xl">
        <Link to="/" className="flex flex-col items-center gap-1 text-gray-600 hover:text-primary transition-colors">
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-medium">Início</span>
        </Link>
        <Link to="/clientes" className="flex flex-col items-center gap-1 text-gray-600 hover:text-primary transition-colors">
          <Users size={24} />
          <span className="text-[10px] font-medium">Clientes</span>
        </Link>
        <div className="relative -top-8 md:top-0">
          <Link to="/captura" className="flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-transform active:scale-95">
            <Camera size={28} />
          </Link>
        </div>
        <Link to="/relatorios" className="flex flex-col items-center gap-1 text-gray-600 hover:text-primary transition-colors">
          <Sparkles size={24} />
          <span className="text-[10px] font-medium">Análises</span>
        </Link>
        <div className="hidden md:block w-6 h-6"></div>
      </div>
    </nav>
  );
};

export default Navbar;