import React, { useEffect, useRef, useState } from 'react';
import ImageAnnotator, { RegionBBox } from '@/components/camera/ImageAnnotator';
import AnalysisModeIllustration from '@/components/camera/AnalysisModeIllustration';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Camera,
  RefreshCw,
  Check,
  ArrowLeft,
  Upload,
  Loader2,
  User,
  BrainCircuit,
  Pencil,
  FileText,
  Columns,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { performDualAnalysis } from '@/services/analysis';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { uploadPhotoToR2 } from '@/lib/r2';
import type { AnalysisImage } from '@/services/types';

const ANALYSIS_MODES = [
  { id: 'single', label: 'Sem Comparações', icon: FileText },
  { id: 'comparison', label: 'Com Comparações', icon: Columns },
  { id: 'tricoscopia', label: 'Tricoscopia', icon: BrainCircuit },
] as const;

type AnalysisMode = (typeof ANALYSIS_MODES)[number]['id'];

const MAX_UPLOAD_DIMENSION = 8192;

const resizeImageIfNeeded = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const needsResize = img.width > MAX_UPLOAD_DIMENSION || img.height > MAX_UPLOAD_DIMENSION;
        const scale = needsResize
          ? Math.min(MAX_UPLOAD_DIMENSION / img.width, MAX_UPLOAD_DIMENSION / img.height)
          : 1;

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Erro ao criar contexto da imagem.'));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.98));
      };
      img.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
};

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const [header, data] = dataurl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(data || '');
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], filename, { type: mime });
};

const Capture = () => {
  const [capturedImages, setCapturedImages] = useState<AnalysisImage[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('single');
  const [isPreparingImage, setIsPreparingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from('clients').select('id, name').order('name');
      if (data) setClients(data);
    };

    fetchClients();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsPreparingImage(true);
    try {
      const optimizedImage = await resizeImageIfNeeded(file);
      setCurrentImage(optimizedImage);
    } catch (error: any) {
      showError(error.message || 'Não foi possível carregar a foto.');
    } finally {
      setIsPreparingImage(false);
    }
  };

  const addImageToFlow = async (annotatedBase64: string, bboxes: Record<string, RegionBBox>) => {
    setIsPreparingImage(true);
    try {
      const file = dataURLtoFile(annotatedBase64, `annotated-${Date.now()}.jpg`);

      let imageUrl = annotatedBase64;
      let uploadSuccess = false;

      try {
        const uploadRes = await uploadPhotoToR2(file);
        if (uploadRes?.url) {
          imageUrl = uploadRes.url;
          uploadSuccess = true;
        }
      } catch (r2Error) {
        console.warn('R2 upload failed, trying Supabase storage...', r2Error);

        try {
          const fileName = `photos/${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
          const { data, error } = await supabase.storage.from('photos').upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

          if (!error && data) {
            const {
              data: { publicUrl },
            } = supabase.storage.from('photos').getPublicUrl(fileName);
            imageUrl = publicUrl;
            uploadSuccess = true;
          }
        } catch (supabaseError) {
          console.warn('Supabase storage upload failed, using base64 fallback:', supabaseError);
        }
      }

      setCapturedImages((prev) => [...prev, { url: imageUrl, dataUrl: annotatedBase64, bboxes }]);
      setCurrentImage(null);
      setIsAnnotating(false);

      showSuccess(uploadSuccess ? 'Imagem marcada e enviada com sucesso!' : 'Imagem marcada com sucesso! (Salva localmente)');
    } catch (error: any) {
      showError('Erro ao processar imagem: ' + error.message);
    } finally {
      setIsPreparingImage(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedClientId) {
      showError('Por favor, selecione um cliente.');
      return;
    }

    if (capturedImages.length === 0) {
      showError('Adicione ao menos uma imagem.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await performDualAnalysis(capturedImages);

      if (analysisMode === 'comparison') {
        result.isComparativo = true;
      }

      const { error } = await supabase.from('analyses').insert([
        {
          client_id: selectedClientId,
          image_url: capturedImages[capturedImages.length - 1].url,
          result,
        },
      ]);

      if (error) throw error;

      showSuccess('Análise concluída!');
      navigate('/resultado', {
        state: {
          analysis: result,
          image: capturedImages[capturedImages.length - 1].url,
          allImages: capturedImages,
        },
      });
    } catch (error: any) {
      showError('Falha na análise: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnnotateImage = () => {
    if (!currentImage) {
      showError('Selecione uma imagem antes de marcar.');
      return;
    }
    setIsAnnotating(true);
  };

  const resetFlow = () => {
    setCapturedImages([]);
    setCurrentImage(null);
    setIsAnnotating(false);
  };

  if (isAnnotating && currentImage) {
    return (
      <ImageAnnotator
        image={currentImage}
        onSave={(img, boxes) => addImageToFlow(img, boxes)}
        onCancel={() => setIsAnnotating(false)}
      />
    );
  }

  const hasAtLeastOneImage = capturedImages.length >= 1;
  const captureTitle =
    analysisMode === 'tricoscopia'
      ? 'Tricoscopia'
      : analysisMode === 'comparison'
        ? 'Comparação Técnica'
        : 'Captura Técnica';

  const captureSubtitle =
    analysisMode === 'tricoscopia'
      ? 'Diagnóstico Capilar • Tricoscopia'
      : analysisMode === 'comparison'
        ? 'Diagnóstico Capilar • Antes e Depois'
        : 'Diagnóstico Capilar';

  return (
    <div className="min-h-screen bg-[#1C3A2B] text-[#E8DECE] pb-28 md:pt-20">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-4 sm:py-6">
        <header className="mb-5 sm:mb-6">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
            </button>

            <div className="text-center flex-1">
              <h1 className="font-heading text-lg sm:text-xl font-normal">{captureTitle}</h1>
              <p className="font-label-category text-[9px] sm:text-[10px] text-[#8FAF8A] mt-1">{captureSubtitle}</p>
            </div>

            <button onClick={resetFlow} className="p-2 rounded-full hover:bg-white/10 transition-colors text-red-300">
              <Trash2 size={18} />
            </button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4">
            <Card className="border border-[#4A7A5C]/40 bg-[#3D6B52]/35 text-[#E8DECE] rounded-3xl overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 text-[#8FAF8A]">
                  <User size={18} />
                  <span className="font-label-category text-[10px]">Selecionar Cliente</span>
                </div>

                <div className="rounded-2xl border border-[#4A7A5C] bg-[#1C3A2B]/30 px-4 py-3">
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-transparent text-[#E8DECE] outline-none text-sm"
                  >
                    <option value="" className="text-black">
                      Selecionar Cliente
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id} className="text-black">
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ANALYSIS_MODES.map((mode) => {
                    const Icon = mode.icon;
                    const active = analysisMode === mode.id;

                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setAnalysisMode(mode.id);
                          setCapturedImages([]);
                          setCurrentImage(null);
                        }}
                        className={cn(
                          'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[11px] font-bold transition-all',
                          active
                            ? 'bg-[#4A7A5C] border-[#8FAF8A] text-[#E8DECE] shadow-lg'
                            : 'bg-[#1C3A2B]/25 border-[#4A7A5C] text-[#8FAF8A] hover:bg-[#1C3A2B]/40',
                        )}
                      >
                        <Icon size={14} />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#4A7A5C]/30 bg-[#1C3A2B]/70 text-[#E8DECE] rounded-3xl overflow-hidden">
              <CardContent className="p-3 sm:p-4">
                <div className="relative overflow-hidden rounded-2xl border border-[#4A7A5C]/50 bg-[#10261C] min-h-[360px] sm:min-h-[420px] flex items-center justify-center">
                  {!currentImage ? (
                    !hasAtLeastOneImage ? (
                      <div className="w-full h-full min-h-[360px] sm:min-h-[420px] flex items-center justify-center p-6 text-center">
                        <AnalysisModeIllustration mode={analysisMode} />
                      </div>
                    ) : (
                      <div className="w-full h-full min-h-[360px] sm:min-h-[420px] p-4 sm:p-6 flex flex-col justify-center gap-5">
                        <div className="flex flex-wrap gap-3 justify-center">
                          {capturedImages.map((img, i) => (
                            <div
                              key={i}
                              className="w-[110px] sm:w-32 rounded-2xl overflow-hidden border border-[#4A7A5C] bg-[#1C3A2B] shadow-xl"
                            >
                              <div className="aspect-[3/4]">
                                <img src={img.url} className="h-full w-full object-cover" alt={`Imagem ${i + 1}`} />
                              </div>
                              <div className="bg-[#4A7A5C] px-2 py-1 text-center text-[9px] font-label-category text-[#E8DECE]">
                                {analysisMode === 'comparison'
                                  ? 'Montagem'
                                  : analysisMode === 'tricoscopia'
                                    ? 'Tricoscopia'
                                    : 'Captura'}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="text-center">
                          <h3 className="font-heading text-base font-normal text-[#E8DECE]">Tudo pronto</h3>
                          <p className="mt-1 font-body text-xs text-[#8FAF8A]">Agora você pode gerar o diagnóstico.</p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="relative h-full w-full min-h-[360px] sm:min-h-[420px]">
                      <img src={currentImage} className="h-full w-full object-contain" alt="Imagem carregada" />
                      <div className="absolute inset-0 flex items-end justify-center p-4 sm:p-6 pointer-events-none">
                        <div className="pointer-events-auto rounded-2xl border border-[#8FAF8A]/25 bg-[#4A7A5C]/90 px-4 py-3 text-center text-[#E8DECE] shadow-2xl backdrop-blur-md">
                          <p className="text-xs font-bold">Foto carregada</p>
                          <p className="mt-1 text-[9px] uppercase tracking-wider opacity-80">
                            Clique em “Marcar” para prosseguir
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isPreparingImage && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md">
                      <Loader2 className="mb-3 h-10 w-10 animate-spin text-[#8FAF8A]" />
                      <p className="text-sm font-bold">Preparando imagem...</p>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                      <BrainCircuit className="mb-4 h-16 w-16 animate-pulse text-[#8FAF8A]" />
                      <p className="text-base font-bold">Processando Diagnóstico...</p>
                      <p className="mt-2 text-xs text-slate-300">Analisando evolução técnica</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-4">
            <Card className="border border-[#D4C9B5] bg-[#E8DECE] text-[#1C3A2B] rounded-3xl">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-elha-outline h-12 gap-2"
                  >
                    <Upload size={14} />
                    Upload
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    className="btn-elha-outline h-12 gap-2"
                  >
                    <Camera size={14} />
                    Câmera
                  </Button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                {currentImage ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="btn-elha-outline h-12 gap-2"
                      onClick={() => setCurrentImage(null)}
                    >
                      <RefreshCw size={14} />
                      Repetir
                    </Button>

                    <Button
                      className="btn-elha-primary h-12 gap-2"
                      onClick={handleAnnotateImage}
                      disabled={isPreparingImage}
                    >
                      <Pencil size={14} />
                      Marcar
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#D4C9B5] bg-[#F5F0E8] p-4 text-center">
                    <p className="font-heading text-sm text-[#1C3A2B]">
                      {hasAtLeastOneImage ? 'Imagem pronta para análise' : 'Nenhuma imagem carregada'}
                    </p>
                    <p className="mt-1 text-xs text-[#4A7A5C]">
                      {hasAtLeastOneImage ? 'Clique abaixo para gerar o diagnóstico.' : 'Escolha uma imagem para começar.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {hasAtLeastOneImage && !currentImage && (
              <Button
                className="btn-elha-primary w-full h-14 gap-2"
                onClick={handleConfirm}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                Gerar Diagnóstico
              </Button>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Capture;