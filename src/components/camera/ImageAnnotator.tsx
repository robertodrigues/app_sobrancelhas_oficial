import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Check, X, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageAnnotatorProps {
  image: string;
  onSave: (annotatedImage: string) => void;
  onCancel: () => void;
}

type Region = 'ponto_inicial' | 'meio' | 'cauda' | null;

const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({ image, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeRegion, setActiveRegion] = useState<Region>(null);
  const [isEraser, setIsEraser] = useState(false);

  // Cores mais vibrantes para o modo 'multiply'
  const colors = {
    ponto_inicial: '#4ade80', // Verde brilhante
    meio: '#facc15',          // Amarelo brilhante
    cauda: '#f87171',         // Vermelho brilhante
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        contextRef.current = ctx;
      }
    };
  }, [image]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeRegion && !isEraser) return;
    
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    
    if (isEraser) {
      contextRef.current.globalCompositeOperation = 'destination-out';
      contextRef.current.globalAlpha = 1.0;
      contextRef.current.lineWidth = 40;
    } else if (activeRegion) {
      // O segredo da opacidade: 'multiply' mistura a cor com a imagem de baixo
      // sem esconder os detalhes (como fios de cabelo e poros)
      contextRef.current.globalCompositeOperation = 'multiply';
      contextRef.current.globalAlpha = 0.6; // Opacidade ideal para o modo multiply
      contextRef.current.strokeStyle = colors[activeRegion];
      contextRef.current.lineWidth = 70; // Pincel largo para marcar a região
    }

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    setIsDrawing(false);
  };

  const handleSave = () => {
    if (canvasRef.current) {
      onSave(canvasRef.current.toDataURL('image/jpeg', 0.9));
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="p-4 flex items-center justify-between bg-slate-900 text-white">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X size={24} />
        </Button>
        <div className="text-center">
          <h2 className="font-bold text-sm">Mapeamento Técnico</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Pinte as regiões</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSave} className="text-green-400">
          <Check size={24} />
        </Button>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-950">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="max-w-full max-h-full object-contain touch-none cursor-crosshair"
        />
        
        {!activeRegion && !isEraser && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md p-6 rounded-3xl text-white text-center border border-white/10">
              <MousePointer2 className="mx-auto mb-3 animate-bounce text-accent" size={32} />
              <p className="text-sm font-bold">Selecione uma cor abaixo</p>
              <p className="text-xs text-slate-400">e pinte a região da sobrancelha</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-900 space-y-4 border-t border-slate-800">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => { setActiveRegion('ponto_inicial'); setIsEraser(false); }}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
              activeRegion === 'ponto_inicial' ? "border-green-500 bg-green-500/20" : "border-slate-700 bg-slate-800/50"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-bold text-white uppercase">Início</span>
          </button>
          
          <button
            onClick={() => { setActiveRegion('meio'); setIsEraser(false); }}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
              activeRegion === 'meio' ? "border-yellow-500 bg-yellow-500/20" : "border-slate-700 bg-slate-800/50"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
            <span className="text-[10px] font-bold text-white uppercase">Meio</span>
          </button>

          <button
            onClick={() => { setActiveRegion('cauda'); setIsEraser(false); }}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
              activeRegion === 'cauda' ? "border-red-500 bg-red-500/20" : "border-slate-700 bg-slate-800/50"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] font-bold text-white uppercase">Cauda</span>
          </button>
        </div>

        <Button
          variant="outline"
          onClick={() => { setIsEraser(!isEraser); setActiveRegion(null); }}
          className={cn(
            "w-full h-14 gap-2 rounded-2xl border-slate-700 text-white transition-all",
            isEraser ? "bg-white text-slate-900" : "bg-slate-800/50"
          )}
        >
          <Eraser size={20} />
          {isEraser ? "Borracha Ativa" : "Usar Borracha"}
        </Button>
      </div>
    </div>
  );
};

export default ImageAnnotator;