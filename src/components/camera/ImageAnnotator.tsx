import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Undo2, Check, X, MousePointer2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RegionBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface ImageAnnotatorProps {
  image: string;
  onSave: (annotatedImage: string, bboxes: Record<string, RegionBBox>) => void;
  onCancel: () => void;
}

type Region = 'ponto_inicial' | 'meio' | 'cauda' | null;

const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({ image, onSave, onCancel }) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeRegion, setActiveRegion] = useState<Region>(null);
  const [brushSize, setBrushSize] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<{data: string, bboxes: Record<string, RegionBBox>}[]>([]);
  const [currentBBoxes, setCurrentBBoxes] = useState<Record<string, RegionBBox>>({});
  const imageRef = useRef<HTMLImageElement | null>(null);

  const colors = {
    ponto_inicial: '#8FAF8A', // Verde menta
    meio: '#D4C9B5',          // Bege areia
    cauda: '#4A7A5C',         // Verde sage
  };

  const render = () => {
    const canvas = mainCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    const img = imageRef.current;
    if (!canvas || !drawingCanvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.9;
    ctx.drawImage(drawingCanvas, 0, 0);
    ctx.globalAlpha = 1.0;
  };

  useEffect(() => {
    const img = new Image();
    if (image.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      imageRef.current = img;
      const canvas = mainCanvasRef.current;
      if (!canvas) return;

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const drawingCanvas = document.createElement('canvas');
      drawingCanvas.width = canvas.width;
      drawingCanvas.height = canvas.height;
      drawingCanvasRef.current = drawingCanvas;

      setCurrentBBoxes({});
      setHistory([{ data: drawingCanvas.toDataURL(), bboxes: {} }]);
      
      // Draw initial image
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };

    img.onerror = (err) => {
      console.error('Erro ao carregar imagem para anotação:', err);
    };

    img.src = image;
  }, [image]);

  const updateBBox = (region: string, x: number, y: number) => {
    setCurrentBBoxes(prev => {
      const current = prev[region] || { minX: x, minY: y, maxX: x, maxY: y };
      return {
        ...prev,
        [region]: {
          minX: Math.min(current.minX, x - brushSize / 2),
          minY: Math.min(current.minY, y - brushSize / 2),
          maxX: Math.max(current.maxX, x + brushSize / 2),
          maxY: Math.max(current.maxY, y + brushSize / 2),
        }
      };
    });
  };

  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return null;

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

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeRegion || !drawingCanvasRef.current) return;
    
    const position = getPointerPosition(e);
    if (!position) return;

    const dCtx = drawingCanvasRef.current.getContext('2d');
    if (dCtx) {
      dCtx.beginPath();
      dCtx.moveTo(position.x, position.y);
      dCtx.lineCap = 'round';
      dCtx.lineJoin = 'round';
      dCtx.strokeStyle = colors[activeRegion];
      dCtx.lineWidth = brushSize;
      dCtx.globalCompositeOperation = 'source-over';
      updateBBox(activeRegion, position.x, position.y);
    }

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !drawingCanvasRef.current || !mainCanvasRef.current || !activeRegion) return;

    const position = getPointerPosition(e);
    if (!position) return;

    const dCtx = drawingCanvasRef.current.getContext('2d');
    if (dCtx) {
      dCtx.lineTo(position.x, position.y);
      dCtx.stroke();
      updateBBox(activeRegion, position.x, position.y);
      render();
    }
  };

  const stopDrawing = () => {
    if (isDrawing && drawingCanvasRef.current) {
      setHistory(prev => [...prev, { data: drawingCanvasRef.current!.toDataURL(), bboxes: { ...currentBBoxes } }]);
    }
    setIsDrawing(false);
  };

  const undo = () => {
    if (history.length <= 1 || !drawingCanvasRef.current) return;
    
    const newHistory = [...history];
    newHistory.pop();
    const lastState = newHistory[newHistory.length - 1];
    
    const img = new Image();
    img.onload = () => {
      const dCtx = drawingCanvasRef.current?.getContext('2d');
      if (dCtx) {
        dCtx.clearRect(0, 0, drawingCanvasRef.current!.width, drawingCanvasRef.current!.height);
        dCtx.drawImage(img, 0, 0);
        setHistory(newHistory);
        setCurrentBBoxes(lastState.bboxes);
        render();
      }
    };
    img.src = lastState.data;
  };

  const handleSave = () => {
    if (mainCanvasRef.current) {
      onSave(mainCanvasRef.current.toDataURL('image/jpeg', 0.9), currentBBoxes);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1C3A2B] z-50 flex flex-col text-[#E8DECE]">
      <div className="p-4 flex items-center justify-between bg-[#1C3A2B] border-b border-[#4A7A5C]/30 text-[#E8DECE] pt-6">
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-[#E8DECE] hover:bg-white/10">
          <X size={24} />
        </Button>
        <div className="text-center">
          <h2 className="font-heading text-base font-normal text-[#E8DECE]">Mapeamento Técnico</h2>
          <p className="font-label-category text-[9px] text-[#8FAF8A]">Circule as regiões</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSave} className="text-[#8FAF8A] hover:bg-white/10">
          <Check size={24} />
        </Button>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#1C3A2B]/90">
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
            <div className="bg-[#1C3A2B]/90 backdrop-blur-md p-6 rounded-3xl text-center border border-[#4A7A5C] max-w-xs">
              <MousePointer2 className="mx-auto mb-3 animate-bounce text-[#8FAF8A]" size={32} />
              <p className="font-heading text-base font-normal text-[#E8DECE]">Selecione uma cor abaixo</p>
              <p className="font-body text-xs text-[#8FAF8A] mt-1">e circule a região correspondente na sobrancelha</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-[#1C3A2B] space-y-6 border-t border-[#4A7A5C]/30">
        <div className="flex items-center justify-center gap-6 bg-[#3D6B52]/50 border border-[#4A7A5C] p-3 rounded-2xl">
          <button onClick={() => setBrushSize(4)} className={cn("p-2 rounded-full transition-all", brushSize === 4 ? "bg-[#4A7A5C] text-[#E8DECE]" : "text-[#8FAF8A]/70")}>
            <Circle size={8} fill="currentColor" />
          </button>
          <button onClick={() => setBrushSize(8)} className={cn("p-2 rounded-full transition-all", brushSize === 8 ? "bg-[#4A7A5C] text-[#E8DECE]" : "text-[#8FAF8A]/70")}>
            <Circle size={14} fill="currentColor" />
          </button>
          <button onClick={() => setBrushSize(14)} className={cn("p-2 rounded-full transition-all", brushSize === 14 ? "bg-[#4A7A5C] text-[#E8DECE]" : "text-[#8FAF8A]/70")}>
            <Circle size={20} fill="currentColor" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setActiveRegion('ponto_inicial')}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
              activeRegion === 'ponto_inicial' ? "border-[#8FAF8A] bg-[#8FAF8A]/20" : "border-[#4A7A5C] bg-[#3D6B52]/30"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-[#8FAF8A]" />
            <span className="font-label-category text-[9px] text-[#E8DECE]">Início</span>
          </button>
          
          <button
            onClick={() => setActiveRegion('meio')}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
              activeRegion === 'meio' ? "border-[#D4C9B5] bg-[#D4C9B5]/20" : "border-[#4A7A5C] bg-[#3D6B52]/30"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-[#D4C9B5]" />
            <span className="font-label-category text-[9px] text-[#E8DECE]">Meio</span>
          </button>

          <button
            onClick={() => setActiveRegion('cauda')}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
              activeRegion === 'cauda' ? "border-[#4A7A5C] bg-[#4A7A5C]/20" : "border-[#4A7A5C] bg-[#3D6B52]/30"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-[#4A7A5C]" />
            <span className="font-label-category text-[9px] text-[#E8DECE]">Cauda</span>
          </button>
        </div>

        <Button
          variant="outline"
          onClick={undo}
          disabled={history.length <= 1}
          className="btn-elha-outline w-full h-14 gap-2 border-[#4A7A5C] text-[#E8DECE] hover:bg-[#3D6B52]/50 disabled:opacity-30"
        >
          <Undo2 size={18} />
          Desfazer Último Traço
        </Button>
      </div>
    </div>
  );
};

export default ImageAnnotator;