import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Undo2, Check, X, MousePointer2, Circle } from 'lucide-react';
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
  const [brushSize, setBrushSize] = useState(60);
  const [history, setHistory] = useState<string[]>([]);

  const colors = {
    ponto_inicial: '#4ade80',
    meio: '#facc15',
    cauda: '#f87171',
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
        // Salva o estado inicial no histórico
        setHistory([canvas.toDataURL()]);
      }
    };
  }, [image]);

  const saveToHistory = () => {
    if (canvasRef.current) {
      const newStep = canvasRef.current.toDataURL();
      setHistory(prev => [...prev, newStep]);
    }
  };

  const undo = () => {
    if (history.length <= 1) return;
    
    const newHistory = [...history];
    newHistory.pop(); // Remove o estado atual
    const lastState = newHistory[newHistory.length - 1];
    
    const img = new Image();
    img.src = lastState;
    img.onload = () => {
      if (contextRef.current && canvasRef.current) {
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        contextRef.current.drawImage(img, 0, 0);
        setHistory(newHistory);
      }
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeRegion) return;
    
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
    
    contextRef.current.globalCompositeOperation = 'multiply';
    contextRef.current.globalAlpha = 0.35; // Opacidade bem suave
    contextRef.current.strokeStyle = colors[activeRegion];
    contextRef.current.lineWidth = brushSize;

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
    if (isDrawing) {
      saveToHistory();
    }
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
        
        {!activeRegion && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md p-6 rounded-3xl text-white text-center border border-white/10">
              <MousePointer2 className="mx-auto mb-3 animate-bounce text-accent" size={32} />
              <p className="text-sm font-bold">Selecione uma cor abaixo</p>
              <p className="text-xs text-slate-400">e pinte a região da sobrancelha</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-900 space-y-6 border-t border-slate-800">
        {/* Seletor de Tamanho do Pincel */}
        <div className="flex items-center justify-center gap-6 bg-slate-800/50 p-3 rounded-2xl">
          <button onClick={() => setBrushSize(30)} className={cn("p-2 rounded-full transition-all", brushSize === 30 ? "bg-accent text-white" : "text-slate-400")}>
            <Circle size={12} fill="currentColor" />
          </button>
          <button onClick={() => setBrushSize(60)} className={cn("p-2 rounded-full transition-all", brushSize === 60 ? "bg-accent text-white" : "text-slate-400")}>
            <Circle size={20} fill="currentColor" />
          </button>
          <button onClick={() => setBrushSize(90)} className={cn("p-2 rounded-full transition-all", brushSize === 90 ? "bg-accent text-white" : "text-slate-400")}>
            <Circle size={28} fill="currentColor" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setActiveRegion('ponto_inicial')}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
              activeRegion === 'ponto_inicial' ? "border-green-500 bg-green-500/20" : "border-slate-700 bg-slate-800/50"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold text-white uppercase">Início</span>
          </button>
          
          <button
            onClick={() => setActiveRegion('meio')}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
              activeRegion === 'meio' ? "border-yellow-500 bg-yellow-500/20" : "border-slate-700 bg-slate-800/50"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-yellow-500" />
            <span className="text-[10px] font-bold text-white uppercase">Meio</span>
          </button>

          <button
            onClick={() => setActiveRegion('cauda')}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
              activeRegion === 'cauda' ? "border-red-500 bg-red-500/20" : "border-slate-700 bg-slate-800/50"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-white uppercase">Cauda</span>
          </button>
        </div>

        <Button
          variant="outline"
          onClick={undo}
          disabled={history.length <= 1}
          className="w-full h-14 gap-2 rounded-2xl border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700 disabled:opacity-30"
        >
          <Undo2 size={20} />
          Desfazer Último Traço
        </Button>
      </div>
    </div>
  );
};

export default ImageAnnotator;