"use client";

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
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
  Sliders,
  Maximize2,
  Palette,
  FileText
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';
import { uploadPhotoToR2 } from '@/lib/r2';
import { useUser } from '@/lib/auth';
import { createUserStorageKey } from '@/lib/userStorage';
import PhotoEditorFrame, { type PhotoTransform } from '@/components/edition/PhotoEditorFrame';

const SUPPORTED_UPLOAD_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

const createDefaultTransform = (): PhotoTransform => ({
  x: 0,
  y: 0,
  scale: 1,
});

const clampScale = (scale: number) => Math.min(3, Math.max(1, scale));

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
  const { user } = useUser();

  const [beforeImg, setBeforeImg] = useState<string | null>(null);
  const [afterImg, setAfterImg] = useState<string | null>(null);
  const [beforeTransform, setBeforeTransform] = useState<PhotoTransform>(createDefaultTransform());
  const [afterTransform, setAfterTransform] = useState<PhotoTransform>(createDefaultTransform());
  
  const [layoutSize, setLayoutSize] = useState<'feed' | 'story'>('feed');
  const [splitDirection, setSplitDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [separationType, setSeparationType] = useState<'straight' | 'faded'>('straight');

  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#E8DECE');
  const [textSize, setTextSize] = useState(16);
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(90);

  const [logoImg, setLogoImg] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(80);
  const [logoX, setLogoX] = useState(50);
  const [logoY, setLogoY] = useState(10);

  const [penColor, setPenColor] = useState('#8FAF8A');
  const [penWidth, setPenWidth] = useState(4);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  const [pdfLogo, setPdfLogo] = useState<string | null>(null);
  const [pdfBgColor, setPdfBgColor] = useState('#F5F0E8');

  useEffect(() => {
    if (!user?.id) {
      setPdfLogo(null);
      setPdfBgColor('#F5F0E8');
      return;
    }

    const savedLogo = localStorage.getItem(createUserStorageKey(user.id, 'pdf_custom_logo'));
    const savedBg = localStorage.getItem(createUserStorageKey(user.id, 'pdf_custom_bg_color'));
    setPdfLogo(savedLogo);
    setPdfBgColor(savedBg || '#F5F0E8');
  }, [user?.id]);

  useEffect(() => {
    setBeforeImg(null);
    setAfterImg(null);
    setBeforeTransform(createDefaultTransform());
    setAfterTransform(createDefaultTransform());
    setLayoutSize('feed');
    setSplitDirection('horizontal');
    setSeparationType('straight');
    setText('');
    setTextColor('#E8DECE');
    setTextSize(16);
    setTextX(50);
    setTextY(90);
    setLogoImg(null);
    setLogoSize(80);
    setLogoX(50);
    setLogoY(10);
    setPenColor('#8FAF8A');
    setPenWidth(4);
    setIsDrawingMode(false);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [user?.id]);

  const savePdfSettings = (logo: string | null, bg: string) => {
    if (!user?.id) return;

    if (logo) {
      localStorage.setItem(createUserStorageKey(user.id, 'pdf_custom_logo'), logo);
    } else {
      localStorage.removeItem(createUserStorageKey(user.id, 'pdf_custom_logo'));
    }

    localStorage.setItem(createUserStorageKey(user.id, 'pdf_custom_bg_color'), bg);
    showSuccess('Ajustes do PDF salvos com sucesso!');
  };

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
      if (!user?.id) {
        showError('Sessão inválida. Faça login novamente.');
        return;
      }

      try {
        const normalizedFile = await normalizeImageForUpload(file);
        const uploadRes = await uploadPhotoToR2(normalizedFile, {
          userId: user.id,
          folder: 'pdf-logo',
        });
        setPdfLogo(uploadRes.url);
        savePdfSettings(uploadRes.url, pdfBgColor);
        showSuccess('Logo do PDF enviada com sucesso!');
      } catch (error) {
        console.error('Erro ao enviar logo do PDF:', error);
        showError('Não foi possível enviar a logo do PDF.');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'before') {
        setBeforeImg(result);
        setBeforeTransform(createDefaultTransform());
      }
      if (type === 'after') {
        setAfterImg(result);
        setAfterTransform(createDefaultTransform());
      }
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
      showError('Adicione as fotos de Antes e Depois primeiro.');
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
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] pb-28">
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        <header className="text-center pt-2">
          <div className="w-10 h-10 rounded-xl bg-[#4A7A5C]/10 flex items-center justify-center text-[#4A7A5C] mb-1.5 mx-auto">
            <Sparkles size={20} />
          </div>
          <h1 className="font-heading text-lg font-normal text-[#1C3A2B] tracking-tight">Edição de Antes & Depois</h1>
          <p className="font-body text-[10px] text-[#4A7A5C] font-light">Crie montagens profissionais para suas redes</p>
        </header>

        <div className="flex flex-col items-center justify-center w-full">
          <div className="relative overflow-hidden rounded-2xl border-2 border-[#E8DECE] bg-[#1C3A2B] shadow-xl w-full max-w-[340px]">
            <div 
              ref={collageRef}
              className={cn(
                "relative overflow-hidden rounded-none bg-[#1C3A2B] flex w-full",
                layoutSize === 'feed' ? "aspect-square" : "aspect-[9/16]",
                splitDirection === 'vertical' ? "flex-col" : "flex-row"
              )}
            >
              <div className="relative flex-1 overflow-hidden h-full w-full">
                <PhotoEditorFrame
                  src={beforeImg}
                  label="Antes"
                  value={beforeTransform}
                  onChange={setBeforeTransform}
                />
              </div>

              {separationType === 'straight' ? (
                <div className={cn(
                  "bg-[#E8DECE] z-10 shadow-md",
                  splitDirection === 'horizontal' ? "w-0.5 h-full" : "h-0.5 w-full"
                )} />
              ) : (
                <div className={cn(
                  "absolute z-10 pointer-events-none bg-gradient-to-r from-transparent via-black/40 to-transparent",
                  splitDirection === 'horizontal' 
                    ? "top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r" 
                    : "left-0 right-0 top-1/2 -translate-y-1/2 h-8 bg-gradient-to-b"
                )} />
              )}

              <div className="relative flex-1 overflow-hidden h-full w-full">
                <PhotoEditorFrame
                  src={afterImg}
                  label="Depois"
                  value={afterTransform}
                  onChange={setAfterTransform}
                />
              </div>

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

              {text && (
                <div 
                  style={{ 
                    left: `${textX}%`, 
                    top: `${textY}%`, 
                    color: textColor, 
                    fontSize: `${textSize}px` 
                  }}
                  className="absolute z-30 -translate-x-1/2 -translate-y-1/2 font-bold drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)] pointer-events-none whitespace-nowrap tracking-wide"
                >
                  {text}
                </div>
              )}

              {logoImg && (
                <img 
                  src={logoImg} 
                  style={{ 
                    left: `${logoX}%`, 
                    top: `${logoY}%`, 
                    width: `${logoSize}px`,
                    height: 'auto'
                  }}
                  className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none drop-shadow-md"
                  alt="Logo"
                />
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-3 w-full max-w-[340px]">
            <Button 
              onClick={() => beforeInputRef.current?.click()} 
              variant="outline" 
              className="btn-elha-outline flex-1 h-10 text-[10px]"
            >
              <Upload size={12} className="mr-1" /> Add Antes
            </Button>
            <Button 
              onClick={() => afterInputRef.current?.click()} 
              variant="outline" 
              className="btn-elha-outline flex-1 h-10 text-[10px]"
            >
              <Upload size={12} className="mr-1" /> Add Depois
            </Button>
          </div>

          <input type="file" ref={beforeInputRef} onChange={(e) => handleImageUpload(e, 'before')} accept="image/*" className="hidden" />
          <input type="file" ref={afterInputRef} onChange={(e) => handleImageUpload(e, 'after')} accept="image/*" className="hidden" />
        </div>

        <Card className="border border-[#D4C9B5] bg-[#E8DECE] rounded-2xl shadow-sm overflow-hidden">
          <Tabs defaultValue="layout" className="w-full">
            <TabsList className="grid grid-cols-4 bg-[#1C3A2B]/10 p-1 rounded-t-2xl rounded-b-none h-12">
              <TabsTrigger value="layout" className="text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-[#1C3A2B] data-[state=active]:text-[#E8DECE] rounded-xl">
                <Layers size={14} className="mr-1" /> Layout
              </TabsTrigger>
              <TabsTrigger value="texto" className="text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-[#1C3A2B] data-[state=active]:text-[#E8DECE] rounded-xl">
                <Type size={14} className="mr-1" /> Texto
              </TabsTrigger>
              <TabsTrigger value="logo" className="text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-[#1C3A2B] data-[state=active]:text-[#E8DECE] rounded-xl">
                <Maximize2 size={14} className="mr-1" /> Logo
              </TabsTrigger>
              <TabsTrigger value="desenho" className="text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-[#1C3A2B] data-[state=active]:text-[#E8DECE] rounded-xl">
                <Paintbrush size={14} className="mr-1" /> Caneta
              </TabsTrigger>
            </TabsList>

            <CardContent className="p-4 space-y-4">
              <TabsContent value="layout" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label className="font-label-category text-[9px] text-[#1C3A2B]">Tamanho da Edição</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={layoutSize === 'feed' ? 'default' : 'outline'} 
                      onClick={() => setLayoutSize('feed')}
                      className={cn("h-9 rounded-xl text-[10px] font-bold", layoutSize === 'feed' ? "btn-elha-primary" : "btn-elha-outline")}
                    >
                      Feed (1:1)
                    </Button>
                    <Button 
                      variant={layoutSize === 'story' ? 'default' : 'outline'} 
                      onClick={() => setLayoutSize('story')}
                      className={cn("h-9 rounded-xl text-[10px] font-bold", layoutSize === 'story' ? "btn-elha-primary" : "btn-elha-outline")}
                    >
                      Story (9:16)
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-label-category text-[9px] text-[#1C3A2B]">Orientação da Divisão</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={splitDirection === 'horizontal' ? 'default' : 'outline'} 
                      onClick={() => setSplitDirection('horizontal')}
                      className={cn("h-9 rounded-xl text-[10px] font-bold", splitDirection === 'horizontal' ? "btn-elha-primary" : "btn-elha-outline")}
                    >
                      Lado a Lado
                    </Button>
                    <Button 
                      variant={splitDirection === 'vertical' ? 'default' : 'outline'} 
                      onClick={() => setSplitDirection('vertical')}
                      className={cn("h-9 rounded-xl text-[10px] font-bold", splitDirection === 'vertical' ? "btn-elha-primary" : "btn-elha-outline")}
                    >
                      Cima e Baixo
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-label-category text-[9px] text-[#1C3A2B]">Linha de Separação</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={separationType === 'straight' ? 'default' : 'outline'} 
                      onClick={() => setSeparationType('straight')}
                      className={cn("h-9 rounded-xl text-[10px] font-bold", separationType === 'straight' ? "btn-elha-primary" : "btn-elha-outline")}
                    >
                      Linha Reta
                    </Button>
                    <Button 
                      variant={separationType === 'faded' ? 'default' : 'outline'} 
                      onClick={() => setSeparationType('faded')}
                      className={cn("h-9 rounded-xl text-[10px] font-bold", separationType === 'faded' ? "btn-elha-primary" : "btn-elha-outline")}
                    >
                      Esfumaçada
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="texto" className="space-y-4 mt-0">
                <div className="space-y-1.5">
                  <Label htmlFor="watermark" className="font-label-category text-[9px] text-[#1C3A2B]">Seu @ ou Nome</Label>
                  <Input 
                    id="watermark" 
                    placeholder="Ex: @suasobrancelha" 
                    value={text} 
                    onChange={(e) => setText(e.target.value)}
                    className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-10 rounded-xl text-xs focus-visible:ring-[#1C3A2B]"
                  />
                </div>

                {text && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="font-label-category text-[8px] text-[#4A7A5C]">Cor do Texto</Label>
                        <div className="flex gap-1.5 items-center">
                          <input 
                            type="color" 
                            value={textColor} 
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-8 h-8 rounded-lg border border-[#D4C9B5] cursor-pointer shrink-0"
                          />
                          <Input 
                            value={textColor} 
                            onChange={(e) => setTextColor(e.target.value)}
                            className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] h-8 rounded-lg text-[10px] font-mono px-1.5"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="font-label-category text-[8px] text-[#4A7A5C]">Tamanho ({textSize}px)</Label>
                        <Slider 
                          value={[textSize]} 
                          onValueChange={(val) => setTextSize(val[0])} 
                          min={10} 
                          max={32} 
                          step={1}
                          className="py-2"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="font-label-category text-[8px] text-[#4A7A5C]">Posição Horizontal (X: {textX}%)</Label>
                      <Slider value={[textX]} onValueChange={(val) => setTextX(val[0])} min={5} max={95} />
                    </div>

                    <div className="space-y-1">
                      <Label className="font-label-category text-[8px] text-[#4A7A5C]">Posição Vertical (Y: {textY}%)</Label>
                      <Slider value={[textY]} onValueChange={(val) => setTextY(val[0])} min={5} max={95} />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="logo" className="space-y-4 mt-0">
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => logoInputRef.current?.click()} 
                    variant="outline" 
                    className="btn-elha-outline flex-1 h-10 text-[10px]"
                  >
                    <Upload size={12} className="mr-1" /> Subir Logo PNG
                  </Button>
                  {logoImg && (
                    <Button 
                      onClick={() => setLogoImg(null)} 
                      variant="ghost" 
                      className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-50 p-0 shrink-0"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
                <input type="file" ref={logoInputRef} onChange={(e) => handleImageUpload(e, 'logo')} accept="image/*" className="hidden" />

                {logoImg && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <Label className="font-label-category text-[8px] text-[#4A7A5C]">Tamanho da Logo ({logoSize}px)</Label>
                      <Slider 
                        value={[logoSize]} 
                        onValueChange={(val) => setLogoSize(val[0])} 
                        min={30} 
                        max={200} 
                        step={5}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="font-label-category text-[8px] text-[#4A7A5C]">Posição Horizontal (X: {logoX}%)</Label>
                      <Slider value={[logoX]} onValueChange={(val) => setLogoX(val[0])} min={5} max={95} />
                    </div>

                    <div className="space-y-1">
                      <Label className="font-label-category text-[8px] text-[#4A7A5C]">Posição Vertical (Y: {logoY}%)</Label>
                      <Slider value={[logoY]} onValueChange={(val) => setLogoY(val[0])} min={5} max={95} />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="desenho" className="space-y-4 mt-0">
                <div className="flex items-center justify-between bg-[#F5F0E8] p-2.5 rounded-xl border border-[#D4C9B5]">
                  <span className="font-label-category text-[9px] text-[#1C3A2B]">Modo Caneta</span>
                  <Button 
                    variant={isDrawingMode ? 'default' : 'outline'} 
                    onClick={() => setIsDrawingMode(!isDrawingMode)}
                    className={cn("h-8 rounded-lg text-[9px] font-bold uppercase px-3", isDrawingMode ? "btn-elha-primary" : "btn-elha-outline")}
                  >
                    {isDrawingMode ? 'Ativa' : 'Ativar'}
                  </Button>
                </div>

                {isDrawingMode && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="font-label-category text-[8px] text-[#4A7A5C]">Cor da Caneta</Label>
                        <div className="flex gap-1.5 items-center">
                          <input 
                            type="color" 
                            value={penColor} 
                            onChange={(e) => setPenColor(e.target.value)}
                            className="w-8 h-8 rounded-lg border border-[#D4C9B5] cursor-pointer shrink-0"
                          />
                          <Input 
                            value={penColor} 
                            onChange={(e) => setPenColor(e.target.value)}
                            className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] h-8 rounded-lg text-[10px] font-mono px-1.5"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="font-label-category text-[8px] text-[#4A7A5C]">Espessura ({penWidth}px)</Label>
                        <Slider 
                          value={[penWidth]} 
                          onValueChange={(val) => setPenWidth(val[0])} 
                          min={2} 
                          max={12} 
                          step={1}
                          className="py-2"
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={clearDrawing} 
                      variant="outline" 
                      className="w-full h-9 rounded-xl text-[10px] font-bold text-red-500 border-red-100 hover:bg-red-50"
                    >
                      <RotateCcw size={12} className="mr-1" /> Limpar Desenhos
                    </Button>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <Card className="border border-[#D4C9B5] bg-[#E8DECE] rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-label-category text-[9px] text-[#1C3A2B] flex items-center gap-1.5">
              <FileText size={14} className="text-[#4A7A5C]" /> Ajuste do Relatório PDF
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => pdfLogoInputRef.current?.click()} 
                  variant="outline" 
                  className="btn-elha-outline flex-1 h-10 text-[10px]"
                >
                  <Upload size={12} className="mr-1" /> Subir Logo PDF
                </Button>
                {pdfLogo && (
                  <Button 
                    onClick={() => { setPdfLogo(null); savePdfSettings(null, pdfBgColor); }} 
                    variant="ghost" 
                    className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-50 p-0 shrink-0"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
              <input type="file" ref={pdfLogoInputRef} onChange={(e) => handleImageUpload(e, 'pdfLogo')} accept="image/*" className="hidden" />
              
              {pdfLogo && (
                <div className="p-1.5 bg-[#F5F0E8] rounded-xl border border-[#D4C9B5] flex justify-center">
                  <img src={pdfLogo} className="h-8 object-contain" alt="Logo PDF Preview" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="font-label-category text-[8px] text-[#1C3A2B]">Cor de Fundo do PDF</Label>
              <div className="flex gap-1.5 items-center">
                <input 
                  type="color" 
                  value={pdfBgColor} 
                  onChange={(e) => { setPdfBgColor(e.target.value); savePdfSettings(pdfLogo, e.target.value); }}
                  className="w-8 h-8 rounded-lg border border-[#D4C9B5] cursor-pointer shrink-0"
                />
                <Input 
                  value={pdfBgColor} 
                  onChange={(e) => { setPdfBgColor(e.target.value); savePdfSettings(pdfLogo, e.target.value); }}
                  placeholder="#F5F0E8"
                  className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] h-8 rounded-lg text-[10px] font-mono px-1.5 focus-visible:ring-[#1C3A2B]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={exportCollage}
          className="btn-elha-primary w-full h-12 text-xs"
        >
          <Download size={14} className="mr-1.5" /> Exportar Montagem Final
        </Button>
      </main>
    </div>
  );
};

export default Edition;