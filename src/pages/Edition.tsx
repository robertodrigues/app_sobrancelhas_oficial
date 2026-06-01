"use client";

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Upload, 
  Download, 
  Type, 
  Image as ImageIcon, 
  Paintbrush, 
  Layers, 
  RotateCcw,
  Sparkles,
  Trash2,
  Sliders
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';
import { uploadPhotoToR2 } from '@/lib/r2';

const SUPPORTED_UPLOAD_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

const dataUrlToFile = (dataUrl: string, filename: string) => {
  const [header, base64Data] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || 'image/png';
  const binary = atob(base64Data || '');
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], filename, { type: mimeType });
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo da logo.'));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível preparar a logo para upload.'));
    img.src = src;
  });

const normalizeImageForUpload = async (file: File) => {
  if (SUPPORTED_UPLOAD_TYPES.has(file.type)) {
    return file;
  }

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Não foi possível converter a logo para envio.');
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const pngDataUrl = canvas.toDataURL('image/png');
  return dataUrlToFile(pngDataUrl, `${file.name.replace(/\.[^.]+$/, '') || 'logo'}.png`);
};

const Edition = () => {
  // Imagens de Antes e Depois
  const [beforeImg, setBeforeImg] = useState<string | null>(null);
  const [afterImg, setAfterImg] = useState<string | null>(null);
  
  // Configurações de Layout
  const [layoutSize, setLayoutSize] = useState<'feed' | 'story'>('feed');
  const [splitDirection, setSplitDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [separationType, setSeparationType] = useState<'straight' | 'faded'>('straight');

  // Configurações de Texto (@)
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#E8DECE');
  const [textSize, setTextSize] = useState(16);
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(90);

  // Configurações de Logo da Montagem
  const [logoImg, setLogoImg] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(80);
  const [logoX, setLogoX] = useState(50);
  const [logoY, setLogoY] = useState(10);

  // Caneta Desenho Livre
  const [penColor, setPenColor] = useState('#8FAF8A');
  const [penWidth, setPenWidth] = useState(4);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // --- AJUSTES DO PDF (Salvos no localStorage) ---
  const [pdfLogo, setPdfLogo] = useState<string | null>(null);
  const [pdfBgColor, setPdfBgColor] = useState('#F5F0E8');

  // Carregar configurações salvas do PDF
  useEffect(() => {
    const savedLogo = localStorage.getItem('pdf_custom_logo');
    const savedBg = localStorage.getItem('pdf_custom_bg_color');
    if (savedLogo) setPdfLogo(savedLogo);
    if (savedBg) setPdfBgColor(savedBg);
  }, []);

  // Salvar configurações do PDF
  const savePdfSettings = (logo: string | null, bg: string) => {
    if (logo) {
      localStorage.setItem('pdf_custom_logo', logo);
    } else {
      localStorage.removeItem('pdf_custom_logo');
    }
    localStorage.setItem('pdf_custom_bg_color', bg);
    showSuccess('Ajustes do PDF salvos com sucesso!');
  };

  // Refs
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const pdfLogoInputRef = useRef<HTMLInputElement>(null);
  const collageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after' | 'logo' | 'pdfLogo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'pdfLogo') {
      try {
        const normalizedFile = await normalizeImageForUpload(file);
        const uploadRes = await uploadPhotoToR2(normalizedFile);
        setPdfLogo(uploadRes.url);
        savePdfSettings(uploadRes.url, pdfBgColor);
        showSuccess('Logo do PDF enviada para o R2 com sucesso!');
      } catch (error) {
        console.error('Erro ao enviar logo do PDF para o R2:', error);
        const errorMessage = error instanceof Error ? error.message : 'Não foi possível enviar a logo do PDF para o R2.';
        showError(errorMessage);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'before') setBeforeImg(result);
      if (type === 'after') setAfterImg(result);
      if (type === 'logo') setLogoImg(result);
    };
    reader.readAsDataURL(file);
  };

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
        scale: 3,
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
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] pb-28 md:pt-20">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <header className="mb-8 text-center pt-4">
          <div className="w-12 h-12 rounded-2xl bg-[#4A7A5C]/10 flex items-center justify-center text-[#4A7A5C] mb-3 mx-auto">
            <Sparkles size={24} />
          </div>
          <h1 className="font-heading text-2xl font-normal text-[#1C3A2B] tracking-tight">Edição de Antes & Depois</h1>
          <p className="font-body text-xs text-[#4A7A5C] font-light mt-1">Crie montagens profissionais para suas redes sociais</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Preview da Montagem (Esquerda) */}
          <div className="lg:col-span-7 flex flex-col items-center space-y-6">
            <div 
              ref={collageRef}
              className={cn(
                "relative overflow-hidden bg-[#1C3A2B] shadow-2xl rounded-2xl border-4 border-[#E8DECE] transition-all duration-300 flex",
                layoutSize === 'feed' ? "w-full aspect-square max-w-[400px]" : "w-full aspect-[9/16] max-w-[340px]",
                splitDirection === 'vertical' ? "flex-col" : "flex-row"
              )}
            >
              {/* Foto Antes */}
              <div className="relative flex-1 overflow-hidden h-full w-full">
                {beforeImg ? (
                  <img src={beforeImg} className="w-full h-full object-cover" alt="Antes" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8FAF8A] bg-[#1C3A2B]/80 p-4 text-center">
                    <ImageIcon size={32} className="mb-2 text-[#8FAF8A]/60" />
                    <span className="font-label-category text-[10px] text-[#E8DECE]">Foto Antes</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-[#1C3A2B]/80 backdrop-blur-md text-[#E8DECE] font-label-category text-[9px] px-2.5 py-1 rounded-full">
                  Antes
                </div>
              </div>

              {/* Linha de Separação */}
              {separationType === 'straight' ? (
                <div className={cn(
                  "bg-[#E8DECE] z-10 shadow-lg",
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8FAF8A] bg-[#1C3A2B]/80 p-4 text-center">
                    <ImageIcon size={32} className="mb-2 text-[#8FAF8A]/60" />
                    <span className="font-label-category text-[10px] text-[#E8DECE]">Foto Depois</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-[#4A7A5C] text-[#E8DECE] font-label-category text-[9px] px-2.5 py-1 rounded-full">
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
                className="btn-elha-outline flex-1 h-11"
              >
                <Upload size={14} className="mr-1.5" /> Add Antes
              </Button>
              <Button 
                onClick={() => afterInputRef.current?.click()} 
                variant="outline" 
                className="btn-elha-outline flex-1 h-11"
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
            <div className="bg-[#E8DECE] p-5 rounded-2xl shadow-sm border border-[#D4C9B5] space-y-4">
              <h3 className="font-label-category text-[10px] text-[#1C3A2B] flex items-center gap-2">
                <Layers size={16} className="text-[#4A7A5C]" /> Layout & Formato
              </h3>
              
              <div className="space-y-3">
                <Label className="font-label-category text-[10px] text-[#1C3A2B]">Tamanho da Edição</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={layoutSize === 'feed' ? 'default' : 'outline'} 
                    onClick={() => setLayoutSize('feed')}
                    className={cn("h-11 rounded-xl text-xs font-bold", layoutSize === 'feed' ? "btn-elha-primary" : "btn-elha-outline")}
                  >
                    Feed (1:1)
                  </Button>
                  <Button 
                    variant={layoutSize === 'story' ? 'default' : 'outline'} 
                    onClick={() => setLayoutSize('story')}
                    className={cn("h-11 rounded-xl text-xs font-bold", layoutSize === 'story' ? "btn-elha-primary" : "btn-elha-outline")}
                  >
                    Story (9:16)
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-label-category text-[10px] text-[#1C3A2B]">Orientação da Divisão</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={splitDirection === 'horizontal' ? 'default' : 'outline'} 
                    onClick={() => setSplitDirection('horizontal')}
                    className={cn("h-11 rounded-xl text-xs font-bold", splitDirection === 'horizontal' ? "btn-elha-primary" : "btn-elha-outline")}
                  >
                    Lado a Lado
                  </Button>
                  <Button 
                    variant={splitDirection === 'vertical' ? 'default' : 'outline'} 
                    onClick={() => setSplitDirection('vertical')}
                    className={cn("h-11 rounded-xl text-xs font-bold", splitDirection === 'vertical' ? "btn-elha-primary" : "btn-elha-outline")}
                  >
                    Cima e Baixo
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-label-category text-[10px] text-[#1C3A2B]">Linha de Separação</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={separationType === 'straight' ? 'default' : 'outline'} 
                    onClick={() => setSeparationType('straight')}
                    className={cn("h-11 rounded-xl text-xs font-bold", separationType === 'straight' ? "btn-elha-primary" : "btn-elha-outline")}
                  >
                    Linha Reta
                  </Button>
                  <Button 
                    variant={separationType === 'faded' ? 'default' : 'outline'} 
                    onClick={() => setSeparationType('faded')}
                    className={cn("h-11 rounded-xl text-xs font-bold", separationType === 'faded' ? "btn-elha-primary" : "btn-elha-outline")}
                  >
                    Esfumaçada
                  </Button>
                </div>
              </div>
            </div>

            {/* Marca d'água / Texto */}
            <div className="bg-[#E8DECE] p-5 rounded-2xl shadow-sm border border-[#D4C9B5] space-y-4">
              <h3 className="font-label-category text-[10px] text-[#1C3A2B] flex items-center gap-2">
                <Type size={16} className="text-[#4A7A5C]" /> Texto / Marca d'água
              </h3>

              <div className="space-y-2">
                <Label htmlFor="watermark" className="font-label-category text-[10px] text-[#1C3A2B]">Seu @ ou Nome</Label>
                <Input 
                  id="watermark" 
                  placeholder="Ex: @suasobrancelha" 
                  value={text} 
                  onChange={(e) => setText(e.target.value)}
                  className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
                />
              </div>

              {text && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-label-category text-[9px] text-[#4A7A5C]">Cor do Texto</Label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={textColor} 
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-[#D4C9B5] cursor-pointer"
                        />
                        <Input 
                          value={textColor} 
                          onChange={(e) => setTextColor(e.target.value)}
                          className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] h-10 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-label-category text-[9px] text-[#4A7A5C]">Tamanho</Label>
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
                    <Label className="font-label-category text-[9px] text-[#4A7A5C]">Posição Horizontal (X)</Label>
                    <Slider value={[textX]} onValueChange={(val) => setTextX(val[0])} min={5} max={95} />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-label-category text-[9px] text-[#4A7A5C]">Posição Vertical (Y)</Label>
                    <Slider value={[textY]} onValueChange={(val) => setTextY(val[0])} min={5} max={95} />
                  </div>
                </div>
              )}
            </div>

            {/* Upload de Logo da Montagem */}
            <div className="bg-[#E8DECE] p-5 rounded-2xl shadow-sm border border-[#D4C9B5] space-y-4">
              <h3 className="font-label-category text-[10px] text-[#1C3A2B] flex items-center gap-2">
                <ImageIcon size={16} className="text-[#4A7A5C]" /> Sua Logomarca na Montagem
              </h3>

              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => logoInputRef.current?.click()} 
                  variant="outline" 
                  className="btn-elha-outline flex-1 h-11"
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
                    <Label className="font-label-category text-[9px] text-[#4A7A5C]">Tamanho da Logo</Label>
                    <Slider 
                      value={[logoSize]} 
                      onValueChange={(val) => setLogoSize(val[0])} 
                      min={30} 
                      max={200} 
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-label-category text-[9px] text-[#4A7A5C]">Posição Horizontal (X)</Label>
                    <Slider value={[logoX]} onValueChange={(val) => setLogoX(val[0])} min={5} max={95} />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-label-category text-[9px] text-[#4A7A5C]">Posição Vertical (Y)</Label>
                    <Slider value={[logoY]} onValueChange={(val) => setLogoY(val[0])} min={5} max={95} />
                  </div>
                </div>
              )}
            </div>

            {/* Caneta Desenho Livre */}
            <div className="bg-[#E8DECE] p-5 rounded-2xl shadow-sm border border-[#D4C9B5] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-label-category text-[10px] text-[#1C3A2B] flex items-center gap-2">
                  <Paintbrush size={16} className="text-[#4A7A5C]" /> Caneta de Marcação
                </h3>
                <Button 
                  variant={isDrawingMode ? 'default' : 'outline'} 
                  onClick={() => setIsDrawingMode(!isDrawingMode)}
                  className={cn("h-8 rounded-lg text-[10px] font-bold uppercase px-3", isDrawingMode ? "btn-elha-primary" : "btn-elha-outline")}
                >
                  {isDrawingMode ? 'Ativa' : 'Ativar'}
                </Button>
              </div>

              {isDrawingMode && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-label-category text-[9px] text-[#4A7A5C]">Cor da Caneta</Label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={penColor} 
                          onChange={(e) => setPenColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-[#D4C9B5] cursor-pointer"
                        />
                        <Input 
                          value={penColor} 
                          onChange={(e) => setPenColor(e.target.value)}
                          className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] h-10 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-label-category text-[9px] text-[#4A7A5C]">Espessura</Label>
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
              className="btn-elha-primary w-full h-14"
            >
              <Download size={14} className="mr-1.5" /> Exportar Montagem Final
            </Button>

            {/* CARD DE AJUSTE (LOGO E FUNDO DO PDF) */}
            <Card className="border border-[#D4C9B5] bg-[#E8DECE] rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="font-label-category text-[10px] text-[#1C3A2B] flex items-center gap-2">
                  <Sliders size={16} className="text-[#4A7A5C]" /> Ajuste do Relatório PDF
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-label-category text-[10px] text-[#1C3A2B]">Sua Logo para o PDF</Label>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => pdfLogoInputRef.current?.click()} 
                      variant="outline" 
                      className="btn-elha-outline flex-1 h-11"
                    >
                      <Upload size={14} className="mr-1.5" /> Subir Logo PDF
                    </Button>
                    {pdfLogo && (
                      <Button 
                        onClick={() => { setPdfLogo(null); savePdfSettings(null, pdfBgColor); }} 
                        variant="ghost" 
                        className="h-11 w-11 rounded-xl text-red-500 hover:bg-red-50 p-0"
                      >
                        <Trash2 size={18} />
                      </Button>
                    )}
                  </div>
                  <input type="file" ref={pdfLogoInputRef} onChange={(e) => handleImageUpload(e, 'pdfLogo')} accept="image/*" className="hidden" />
                  {pdfLogo && (
                    <div className="p-2 bg-[#F5F0E8] rounded-xl border border-[#D4C9B5] flex justify-center">
                      <img src={pdfLogo} className="h-12 object-contain" alt="Logo PDF Preview" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="font-label-category text-[10px] text-[#1C3A2B]">Cor de Fundo do PDF</Label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={pdfBgColor} 
                      onChange={(e) => { setPdfBgColor(e.target.value); savePdfSettings(pdfLogo, e.target.value); }}
                      className="w-11 h-11 rounded-xl border border-[#D4C9B5] cursor-pointer"
                    />
                    <Input 
                      value={pdfBgColor} 
                      onChange={(e) => { setPdfBgColor(e.target.value); savePdfSettings(pdfLogo, e.target.value); }}
                      placeholder="#F5F0E8"
                      className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] h-11 rounded-xl text-sm font-mono focus-visible:ring-[#1C3A2B]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      </main>
    </div>
  );
};

export default Edition;