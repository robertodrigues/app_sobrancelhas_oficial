import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, Check, X, MousePointer2, Circle } from 'lucide-react';
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
  mode?: 'single' | 'comparison' | 'tricoscopia';
}

type Region = 'ponto_inicial' | 'meio' | 'cauda' | null;

type DrawingSnapshot = {
  data: string;
  bboxes: Record<string, RegionBBox>;
};

const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({ image, onSave, onCancel, mode = 'single' }) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderRafRef = useRef<number | null>(null);
  const [activeRegion, setActiveRegion] = useState<Region>(null);
  const [brushSize, setBrushSize] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<DrawingSnapshot[]>([]);
  const [redoHistory, setRedoHistory] = useState<DrawingSnapshot[]>([]);
  const [currentBBoxes, setCurrentBBoxes] = useState<Record<string, RegionBBox>>({});
  const currentBBoxesRef = useRef<Record<string, RegionBBox>>({});
  const imageRef = useRef<HTMLImageElement | null>(null);

  const colors = {
    ponto_inicial: '#16A34A',
    meio: '#EAB308',
    cauda: '#DC2626',
  };

  const footerLabels =
    mode === 'tricoscopia'
      ? {
          ponto_inicial: 'Pele',
          meio: 'Óstios',
          cauda: 'Fio',
        }
      : {
          ponto_inicial: 'Início',
          meio: 'Meio',
          cauda: 'Cauda',
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

  const scheduleRender = () => {
    if (renderRafRef.current !== null) return;

    renderRafRef.current = window.requestAnimationFrame(() => {
      renderRafRef.current = null;
      render();
    });
  };

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;

      if (renderRafRef.current !== null) {
        window.cancelAnimationFrame(renderRafRef.current);
      }
    };
  }, []);

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

      currentBBoxesRef.current = {};
      setCurrentBBoxes({});
      setHistory([{ data: drawingCanvas.toDataURL(), bboxes: {} }]);
      setRedoHistory([]);

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
    setCurrentBBoxes((prev) => {
      const current = prev[region] || { minX: x, minY: y, maxX: x, maxY: y };
      const next = {
        ...prev,
        [region]: {
          minX: Math.min(current.minX, x - brushSize / 2),
          minY: Math.min(current.minY, y - brushSize / 2),
          maxX: Math.max(current.maxX, x + brushSize / 2),
          maxY: Math.max(current.maxY, y + brushSize / 2),
        },
      };

      currentBBoxesRef.current = next;
      return next;
    });
  };

  const getStrokeWidth = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return brushSize;

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;

    return brushSize * Math.max(scaleX, scaleY);
  };

  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number;
    let clientY: number;

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

    if ('preventDefault' in e) {
      e.preventDefault();
    }

    const position = getPointerPosition(e);
    if (!position) return;

    const dCtx = drawingCanvasRef.current.getContext('2d');
    if (dCtx) {
      dCtx.beginPath();
      dCtx.moveTo(position.x, position.y);
      dCtx.lineCap = 'round';
      dCtx.lineJoin = 'round';
      dCtx.strokeStyle = colors[activeRegion];
      dCtx.lineWidth = getStrokeWidth();
      dCtx.globalCompositeOperation = 'source-over';
      updateBBox(activeRegion, position.x, position.y);
      scheduleRender();
    }

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !drawingCanvasRef.current || !mainCanvasRef.current || !activeRegion) return;

    if ('preventDefault' in e) {
      e.preventDefault();
    }

    const position = getPointerPosition(e);
    if (!position) return;

    const dCtx = drawingCanvasRef.current.getContext('2d');
    if (dCtx) {
      dCtx.lineWidth = getStrokeWidth();
      dCtx.lineTo(position.x, position.y);
      dCtx.stroke();
      updateBBox(activeRegion, position.x, position.y);
      scheduleRender();
    }
  };

  const stopDrawing = () => {
    if (isDrawing && drawingCanvasRef.current) {
      const snapshot: DrawingSnapshot = {
        data: drawingCanvasRef.current.toDataURL(),
        bboxes: { ...currentBBoxesRef.current },
      };

      setHistory((prev) => [...prev, snapshot]);
      setRedoHistory([]);
    }

    setIsDrawing(false);
    scheduleRender();
  };

  const restoreSnapshot = (snapshot: DrawingSnapshot) => {
    if (!drawingCanvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const dCtx = drawingCanvasRef.current?.getContext('2d');
      if (!dCtx || !drawingCanvasRef.current) return;

      dCtx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
      dCtx.drawImage(img, 0, 0);

      currentBBoxesRef.current = snapshot.bboxes;
      setCurrentBBoxes(snapshot.bboxes);
      scheduleRender();
    };
    img.src = snapshot.data;
  };

  const undo = () => {
    if (history.length <= 1) return;

    const nextHistory = [...history];
    const currentSnapshot = nextHistory.pop();
    if (currentSnapshot) {
      setRedoHistory((prev) => [...prev, currentSnapshot]);
    }

    const previousSnapshot = nextHistory[nextHistory.length - 1];
    if (!previousSnapshot) return;

    setHistory(nextHistory);
    restoreSnapshot(previousSnapshot);
  };

  const redo = () => {
    if (redoHistory.length === 0) return;

    const nextRedo = [...redoHistory];
    const snapshot = nextRedo.pop();
    if (!snapshot) return;

    setRedoHistory(nextRedo);
    setHistory((prev) => [...prev, snapshot]);
    restoreSnapshot(snapshot);
  };

  const handleSave = () => {
    if (mainCanvasRef.current) {
      onSave(mainCanvasRef.current.toDataURL('image/jpeg', 0.9), currentBBoxesRef.current);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex h-full w-full max-h-full max-w-full flex-col overflow-hidden bg-[#1C3A2B] text-[#E8DECE]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#4A7A5C]/30 bg-[#1C3A2B] px-3 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] text-[#E8DECE] sm:px-4">
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-[#E8DECE] hover:bg-white/10">
          <X size={24} />
        </Button>
        <div className="min-w-0 flex-1 px-2 text-center">
          <h2 className="truncate font-heading text-base font-normal text-[#E8DECE]">Mapeamento Técnico</h2>
          <p className="font-label-category text-[9px] text-[#8FAF8A]">Circule as regiões</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSave} className="text-[#8FAF8A] hover:bg-white/10">
          <Check size={24} />
        </Button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#1C3A2B]/90 px-2 py-2">
        <div className="relative flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-[#4A7A5C]/20 bg-[#10261C]">
          <canvas
            ref={mainCanvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="block h-auto w-auto max-h-full max-w-full touch-none cursor-crosshair"
            style={{
              touchAction: 'none',
              width: 'auto',
              height: 'auto',
            }}
          />

          {!activeRegion && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="max-w-xs rounded-3xl border border-[#4A7A5C] bg-[#1C3A2B]/90 p-6 text-center backdrop-blur-md">
                <MousePointer2 className="mx-auto mb-3 animate-bounce text-[#8FAF8A]" size={32} />
                <p className="font-heading text-base font-normal text-[#E8DECE]">Selecione uma cor abaixo</p>
                <p className="mt-1 font-body text-xs text-[#8FAF8A]">e circule a região correspondente na sobrancelha</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 space-y-4 border-t border-[#4A7A5C]/30 bg-[#1C3A2B] px-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6">
        <div className="flex items-center justify-center gap-6 rounded-2xl border border-[#4A7A5C] bg-[#3D6B52]/50 p-3">
          <button
            onClick={() => setBrushSize(4)}
            className={cn('rounded-full p-2 transition-all', brushSize === 4 ? 'bg-[#16A34A] text-white' : 'text-[#8FAF8A]/70')}
          >
            <Circle size={8} fill="currentColor" />
          </button>
          <button
            onClick={() => setBrushSize(8)}
            className={cn('rounded-full p-2 transition-all', brushSize === 8 ? 'bg-[#EAB308] text-white' : 'text-[#8FAF8A]/70')}
          >
            <Circle size={14} fill="currentColor" />
          </button>
          <button
            onClick={() => setBrushSize(14)}
            className={cn('rounded-full p-2 transition-all', brushSize === 14 ? 'bg-[#DC2626] text-white' : 'text-[#8FAF8A]/70')}
          >
            <Circle size={20} fill="currentColor" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setActiveRegion('ponto_inicial')}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all',
              activeRegion === 'ponto_inicial' ? 'border-[#16A34A] bg-[#16A34A]/20' : 'border-[#4A7A5C] bg-[#3D6B52]/30',
            )}
          >
            <div className="h-6 w-6 rounded-full bg-[#16A34A]" />
            <span className="font-label-category text-[9px] text-[#E8DECE]">{footerLabels.ponto_inicial}</span>
          </button>

          <button
            onClick={() => setActiveRegion('meio')}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all',
              activeRegion === 'meio' ? 'border-[#EAB308] bg-[#EAB308]/20' : 'border-[#4A7A5C] bg-[#3D6B52]/30',
            )}
          >
            <div className="h-6 w-6 rounded-full bg-[#EAB308]" />
            <span className="font-label-category text-[9px] text-[#E8DECE]">{footerLabels.meio}</span>
          </button>

          <button
            onClick={() => setActiveRegion('cauda')}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all',
              activeRegion === 'cauda' ? 'border-[#DC2626] bg-[#DC2626]/20' : 'border-[#4A7A5C] bg-[#3D6B52]/30',
            )}
          >
            <div className="h-6 w-6 rounded-full bg-[#DC2626]" />
            <span className="font-label-category text-[9px] text-[#E8DECE]">{footerLabels.cauda}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={undo}
            disabled={history.length <= 1}
            className="h-14 w-full gap-2 border-[#D4C9B5] bg-[#F5F0E8] text-[#1C3A2B] shadow-sm hover:bg-[#E8DECE] active:bg-[#E8DECE] disabled:opacity-40"
          >
            <Undo2 size={18} />
            <span className="font-semibold">Desfazer</span>
          </Button>

          <Button
            variant="outline"
            onClick={redo}
            disabled={redoHistory.length === 0}
            className="h-14 w-full gap-2 border-[#D4C9B5] bg-[#F5F0E8] text-[#1C3A2B] shadow-sm hover:bg-[#E8DECE] active:bg-[#E8DECE] disabled:opacity-40"
          >
            <Redo2 size={18} />
            <span className="font-semibold">Refazer</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageAnnotator;