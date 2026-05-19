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

  const colors = {
    ponto_inicial: '#22c55e', // Verde
    meio: '#eab308',         // Amarelo
    cauda: '#ef4444',        // Vermelho
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
        ctx.lineWidth = 8;
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
      contextRef.current.lineWidth = 20;
    } else if (activeRegion) {
      contextRef.current.globalCompositeOperation = 'source-over';
      contextRef.current.strokeStyle = colors[activeRegion];
      contextRef.current.lineWidth = 8;
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
        <h2 className="font-bold">Marcar Regiões</h2>
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
            <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl text-white text-center">
              <MousePointer2 className="mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-medium">Selecione uma região abaixo para marcar</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-900 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => { setActiveRegion('ponto_inicial'); setIsEraser(false); }}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
              activeRegion === 'ponto_inicial' ? "border-green-500 bg-green-500/10" : "border-slate-700 bg-slate-800"
            )}
          >
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold text-white uppercase">P. Inicial</span>
          </button>
          
          <button
            onClick={() => { setActiveRegion('meio'); setIsEraser(false); }}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
              activeRegion === 'meio' ? "border-yellow-500 bg-yellow-500/10" : "border-slate-700 bg-slate-800"
            )}
          >
            <div className="w-4 h-4 rounded-full bg-yellow-500" />
            <span className="text-[10px] font-bold text-white uppercase">Meio</span>
          </button>

          <button
            onClick={() => { setActiveRegion('cauda'); setIsEraser(false); }}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
              activeRegion === 'cauda' ? "border-red-500 bg-red-500/10" : "border-slate-700 bg-slate-800"
            )}
          >
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-white uppercase">Cauda</span>
          </button>
        </div>

        <Button
          variant="outline"
          onClick={() => { setIsEraser(!isEraser); setActiveRegion(null); }}
          className={cn(
            "w-full h-12 gap-2 rounded-xl border-slate-700 text-white",
            isEraser ? "bg-white text-slate-900" : "bg-slate-800"
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