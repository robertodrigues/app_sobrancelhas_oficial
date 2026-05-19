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
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeRegion, setActiveRegion] = useState<Region>(null);
  const [brushSize, setBrushSize] = useState(60);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const colors = {
    ponto_inicial: '#4ade80',
    meio: '#facc15',
    cauda: '#f87171',
  };

  // Inicialização
  useEffect(() => {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      imageRef.current = img;
      
      // Configura o canvas principal
      const canvas = mainCanvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;

      // Configura o canvas de desenho (offscreen)
      const drawingCanvas = document.createElement('canvas');
      drawingCanvas.width = img.width;
      drawingCanvas.height = img.height;
      drawingCanvasRef.current = drawingCanvas;

      render();
      setHistory([drawingCanvas.toDataURL()]);
    };
  }, [image]);

  // Função de Renderização (Combina Imagem + Camada de Desenho)
  const render = () => {
    const canvas = mainCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    const img = imageRef.current;
    if (!canvas || !drawingCanvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Limpa e desenha a imagem original
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // 2. Desenha a camada de marcação com opacidade FIXA
    // Isso impede que o acúmulo de traços deixe a imagem opaca
    ctx.globalAlpha = 0.4; // Transparência total da marcação
    ctx.drawImage(drawingCanvas, 0, 0);
    ctx.globalAlpha = 1.0;
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeRegion || !drawingCanvasRef.current) return;
    
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

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

    const dCtx = drawingCanvasRef.current.getContext('2d');
    if (dCtx) {
      dCtx.beginPath();
      dCtx.moveTo(x, y);
      dCtx.lineCap = 'round';
      dCtx.lineJoin = 'round';
      dCtx.strokeStyle = colors[activeRegion];
      dCtx.lineWidth = brushSize;
      dCtx.globalCompositeOperation = 'source-over';
    }

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !drawingCanvasRef.current || !mainCanvasRef.current) return;

    const rect = mainCanvasRef.current.getBoundingClientRect();
    const scaleX = mainCanvasRef.current.width / rect.width;
    const scaleY = mainCanvasRef.current.height / rect.height;

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

    const dCtx = drawingCanvasRef.current.getContext('2d');
    if (dCtx) {
      dCtx.lineTo(x, y);
      dCtx.stroke();
      render(); // Atualiza o canvas principal em tempo real
    }
  };

  const stopDrawing = () => {
    if (isDrawing && drawingCanvasRef.current) {
      setHistory(prev => [...prev, drawingCanvasRef.current!.toDataURL()]);
    }
    setIsDrawing(false);
  };

  const undo = () => {
    if (history.length <= 1 || !drawingCanvasRef.current) return;
    
    const newHistory = [...history];
    newHistory.pop();
    const lastState = newHistory[newHistory.length - 1];
    
    const img = new Image();
    img.src = lastState;
    img.onload = () => {
      const dCtx = drawingCanvasRef.current?.getContext('2d');
      if (dCtx) {
        dCtx.clearRect(0, 0, drawingCanvasRef.current!.width, drawingCanvasRef.current!.height);
        dCtx.drawImage(img, 0, 0);
        setHistory(newHistory);
        render();
      }
    };
  };

  const handleSave = () => {
    if (mainCanvasRef.current) {
      onSave(mainCanvasRef.current.toDataURL('image/jpeg', 0.9));
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
          ref={mainCanvasRef}
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