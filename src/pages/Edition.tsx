"use client";

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Upload, 
  Download, 
  Type, 
  Image as ImageIcon, 
  Paintbrush, 
  Layers, 
  Maximize2, 
  RotateCcw,
  Sparkles,
  Check,
  Trash2
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';

const Edition = () => {
  // Imagens de Antes e Depois
  const [beforeImg, setBeforeImg] = useState<string | null>(null);
  const [afterImg, setAfterImg] = useState<string | null>(null);
  
  // Configurações de Layout
  const [layoutSize, setLayoutSize] = useState<'feed' | 'story'>('feed'); // feed (1:1) ou story (9:16)
  const [splitDirection, setSplitDirection] = useState<'horizontal' | 'vertical'>('horizontal'); // horizontal (lado a lado) ou vertical (cima/baixo)
  const [separationType, setSeparationType] = useState<'straight' | 'faded'>('straight'); // reta ou esfumaçada

  // Configurações de Texto (@)
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(16);
  const [textX, setTextX] = useState(50); // porcentagem
  const [textY, setTextY] = useState(90); // porcentagem

  // Configurações de Logo
  const [logoImg, setLogoImg] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(80); // pixels
  const [logoX, setLogoX] = useState(50); // porcentagem
  const [logoY, setLogoY] = useState(10); // porcentagem

  // Caneta Desenho Livre
  const [penColor, setPenColor] = useState('#ff0055');
  const [penWidth, setPenWidth] = useState(4);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Refs
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const collageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Estado de desenho no canvas transparente sobreposto
  const [isDrawing, setIsDrawing] = useState(false);

  // Ajustar tamanho do canvas de desenho quando o layout mudar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && collageRef.current) {
      canvas.width = collageRef.current.clientWidth;
      canvas.height = collageRef.current.clientHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [layoutSize, splitDirection, beforeImg, afterImg]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (type === 'before') setBeforeImg(event.target?.result as string);
        if (type === 'after') setAfterImg(event.target?.result as string);
        if (type === 'logo') setLogoImg(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Funções de Desenho Livre
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      showSuccess('Desenhos limpos!');
    }
  };

  // Exportar Montagem Final
  const exportCollage = async () => {
    if (!beforeImg || !afterImg) {
      showError('Por favor, adicione as fotos de Antes e Depois primeiro.');
      return;
    }

    const element = collageRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 3, // Alta definição para redes sociais
      });

      const link = document.createElement('a');
      link.download = `antes-e-depois-${layoutSize}.jpeg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      showSuccess('Montagem exportada com sucesso!');
    } catch (error) {
      showError('Erro ao exportar imagem.');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pt-20">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <header className="mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-3 mx-auto">
            <Sparkles size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edição de Antes & Depois</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Crie montagens profissionais para suas redes sociais</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Preview da Montagem (Esquerda) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div 
              ref={collageRef}
              className={cn(
                "relative overflow-hidden bg-slate-950 shadow-2xl rounded-3xl border-4 border-white transition-all duration-300 flex",
                layoutSize === 'feed' ? "w-full aspect-square max-w-[400px]" : "w-full aspect-[9/16] max-w-[340px]",
                splitDirection === 'vertical' ? "flex-col" : "flex-row"
              )}
            >
              {/* Foto Antes */}
              <div className="relative flex-1 overflow-hidden h-full w-full">
                {beforeImg ? (
                  <img src={beforeImg} className="w-full h-full object-cover" alt="Antes" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 p-4 text-center">
                    <ImageIcon size={32} className="mb-2 text-slate-600" />
                    <span className="text-xs font-bold uppercase tracking-wider">Foto Antes</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Antes
                </div>
              </div>

              {/* Linha de Separação */}
              {separationType === 'straight' ? (
                <div className={cn(
                  "bg-white z-10 shadow-lg",
                  splitDirection === 'horizontal' ? "w-1 h-full" : "h-1 w-full"
                )} />
              ) : (
                <div className={cn(
                  "absolute z-10 pointer-events-none bg-gradient-to-r from-transparent via-black/40 to-transparent",
                  splitDirection === 'horizontal' 
                    ? "top-0 bottom-0 left-1/2 -translate-x-1/2 w-12 bg-gradient-to-r" 
                    : "left-0 right-0 top-1/2 -translate-y-1/2 h-12 bg-gradient-to-b"
                )} />
              )}

              {/* Foto Depois */}
              <div className="relative flex-1 overflow-hidden h-full w-full">
                {afterImg ? (
                  <img src={afterImg} className="w-full h-full object-cover" alt="Depois" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 p-4 text-center">
                    <ImageIcon size={32} className="mb-2 text-slate-600" />
                    <span className="text-xs font-bold uppercase tracking-wider">Foto Depois</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-accent text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Depois
                </div>
              </div>

              {/* Canvas de Desenho Livre */}
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className={cn(
                  "absolute inset-0 z-20 touch-none",
                  isDrawingMode ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"
                )}
              />

              {/* Marca d'água / Texto */}
              {text && (
                <div 
                  style={{ 
                    left: `${textX}%`, 
                    top: `${textY}%`, 
                    color: textColor, 
                    fontSize: `${textSize}px` 
                  }}
                  className="absolute z-30 -translate-x-1/2 -translate-y-1/2 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none whitespace-nowrap tracking-wide"
                >
                  {text}
                </div>
              )}

              {/* Logo do Usuário */}
              {logoImg && (
                <img 
                  src={logoImg} 
                  style={{ 
                    left: `${logoX}%`, 
                    top: `${logoY}%`, 
                    width: `${logoSize}px`,
                    height: 'auto'
                  }}
                  className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-lg"
                  alt="Logo"
                />
              )}
            </div>

            <div className="flex gap-3 mt-4 w-full max-w-[340px]">
              <Button 
                onClick={() => beforeInputRef.current?.click()} 
                variant="outline" 
                className="flex-1 h-11 rounded-xl text-xs font-bold border-slate-200 bg-white"
              >
                <Upload size={14} className="mr-1.5" /> Add Antes
              </Button>
              <Button 
                onClick={() => afterInputRef.current?.click()} 
                variant="outline" 
                className="flex-1 h-11 rounded-xl text-xs font-bold border-slate-200 bg-white"
              >
                <Upload size={14} className="mr-1.5" /> Add Depois
              </Button>
            </div>

            <input type="file" ref={beforeInputRef} onChange={(e) => handleImageUpload(e, 'before')} accept="image/*" className="hidden" />
            <input type="file" ref={afterInputRef} onChange={(e) => handleImageUpload(e, 'after')} accept="image/*" className="hidden" />
          </div>

          {/* Painel de Controle (Direita) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Formato e Orientação */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-accent" /> Layout & Formato
              </h3>
              
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-600">Tamanho da Edição</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={layoutSize === 'feed' ? 'default' : 'outline'} 
                    onClick={() => setLayoutSize('feed')}
                    className="h-11 rounded-xl text-xs font-bold"
                  >
                    Feed (1:1)
                  </Button>
                  <Button 
                    variant={layoutSize === 'story' ? 'default' : 'outline'} 
                    onClick={() => setLayoutSize('story')}
                    className="h-11 rounded-xl text-xs font-bold"
                  >
                    Story (9:16)
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-600">Orientação da Divisão</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={splitDirection === 'horizontal' ? 'default' : 'outline'} 
                    onClick={() => setSplitDirection('horizontal')}
                    className="h-11 rounded-xl text-xs font-bold"
                  >
                    Lado a Lado
                  </Button>
                  <Button 
                    variant={splitDirection === 'vertical' ? 'default' : 'outline'} 
                    onClick={() => setSplitDirection('vertical')}
                    className="h-11 rounded-xl text-xs font-bold"
                  >
                    Cima e Baixo
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-600">Linha de Separação</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={separationType === 'straight' ? 'default' : 'outline'} 
                    onClick={() => setSeparationType('straight')}
                    className="h-11 rounded-xl text-xs font-bold"
                  >
                    Linha Reta
                  </Button>
                  <Button 
                    variant={separationType === 'faded' ? 'default' : 'outline'} 
                    onClick={() => setSeparationType('faded')}
                    className="h-11 rounded-xl text-xs font-bold"
                  >
                    Esfumaçada
                  </Button>
                </div>
              </div>
            </div>

            {/* Marca d'água / Texto */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Type size={16} className="text-accent" /> Texto / Marca d'água
              </h3>

              <div className="space-y-2">
                <Label htmlFor="watermark" className="text-xs font-bold text-slate-600">Seu @ ou Nome</Label>
                <Input 
                  id="watermark" 
                  placeholder="Ex: @suasobrancelha" 
                  value={text} 
                  onChange={(e) => setText(e.target.value)}
                  className="h-11 rounded-xl text-sm"
                />
              </div>

              {text && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase">Cor do Texto</Label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={textColor} 
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                        />
                        <Input 
                          value={textColor} 
                          onChange={(e) => setTextColor(e.target.value)}
                          className="h-10 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase">Tamanho</Label>
                      <Slider 
                        value={[textSize]} 
                        onValueChange={(val) => setTextSize(val[0])} 
                        min={10} 
                        max={32} 
                        step={1}
                        className="py-4"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Posição Horizontal (X)</Label>
                    <Slider value={[textX]} onValueChange={(val) => setTextX(val[0])} min={5} max={95} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Posição Vertical (Y)</Label>
                    <Slider value={[textY]} onValueChange={(val) => setTextY(val[0])} min={5} max={95} />
                  </div>
                </div>
              )}
            </div>

            {/* Upload de Logo */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={16} className="text-accent" /> Sua Logomarca
              </h3>

              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => logoInputRef.current?.click()} 
                  variant="outline" 
                  className="h-11 rounded-xl text-xs font-bold border-slate-200 bg-white flex-1"
                >
                  <Upload size={14} className="mr-1.5" /> Subir Logo PNG
                </Button>
                {logoImg && (
                  <Button 
                    onClick={() => setLogoImg(null)} 
                    variant="ghost" 
                    className="h-11 w-11 rounded-xl text-red-500 hover:bg-red-50 p-0"
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
              <input type="file" ref={logoInputRef} onChange={(e) => handleImageUpload(e, 'logo')} accept="image/*" className="hidden" />

              {logoImg && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Tamanho da Logo</Label>
                    <Slider 
                      value={[logoSize]} 
                      onValueChange={(val) => setLogoSize(val[0])} 
                      min={30} 
                      max={200} 
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Posição Horizontal (X)</Label>
                    <Slider value={[logoX]} onValueChange={(val) => setLogoX(val[0])} min={5} max={95} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Posição Vertical (Y)</Label>
                    <Slider value={[logoY]} onValueChange={(val) => setLogoY(val[0])} min={5} max={95} />
                  </div>
                </div>
              )}
            </div>

            {/* Caneta Desenho Livre */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Paintbrush size={16} className="text-accent" /> Caneta de Marcação
                </h3>
                <Button 
                  variant={isDrawingMode ? 'default' : 'outline'} 
                  onClick={() => setIsDrawingMode(!isDrawingMode)}
                  className="h-8 rounded-lg text-[10px] font-bold uppercase px-3"
                >
                  {isDrawingMode ? 'Ativa' : 'Ativar'}
                </Button>
              </div>

              {isDrawingMode && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase">Cor da Caneta</Label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={penColor} 
                          onChange={(e) => setPenColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                        />
                        <Input 
                          value={penColor} 
                          onChange={(e) => setPenColor(e.target.value)}
                          className="h-10 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase">Espessura</Label>
                      <Slider 
                        value={[penWidth]} 
                        onValueChange={(val) => setPenWidth(val[0])} 
                        min={2} 
                        max={12} 
                        step={1}
                        className="py-4"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={clearDrawing} 
                    variant="outline" 
                    className="w-full h-10 rounded-xl text-xs font-bold text-red-500 border-red-100 hover:bg-red-50"
                  >
                    <RotateCcw size={14} className="mr-1.5" /> Limpar Desenhos
                  </Button>
                </div>
              )}
            </div>

            {/* Botão de Exportar */}
            <Button 
              onClick={exportCollage}
              className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl shadow-xl shadow-accent/20 flex items-center justify-center gap-2 text-sm"
            >
              <Download size={18} /> Exportar Montagem Final
            </Button>

          </div>

        </div>
      </main>
    </div>
  );
};

export default Edition;