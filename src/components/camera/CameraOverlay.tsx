import React from 'react';

interface CameraOverlayProps {
  side: 'left' | 'right';
}

const CameraOverlay: React.FC<CameraOverlayProps> = ({ side }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Moldura de Alinhamento */}
      <div className="w-64 h-32 border-2 border-dashed border-white/50 rounded-full relative">
        {/* Linha Central Horizontal */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/30"></div>
        
        {/* Indicador de Lado */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider">
          Sobrancelha {side === 'left' ? 'Esquerda' : 'Direita'}
        </div>

        {/* Pontos de Referência (Canto do olho e base do nariz) */}
        <div className={`absolute bottom-0 ${side === 'left' ? 'right-0' : 'left-0'} w-4 h-4 border-b-2 border-primary`}></div>
        <div className={`absolute top-1/2 ${side === 'left' ? 'left-0' : 'right-0'} w-4 h-4 border-t-2 border-primary`}></div>
      </div>
      
      {/* Instruções */}
      <div className="absolute bottom-24 left-0 right-0 text-center px-6">
        <p className="text-white text-sm font-medium drop-shadow-md">
          Alinhe a sobrancelha dentro da moldura pontilhada
        </p>
      </div>
    </div>
  );
};

export default CameraOverlay;