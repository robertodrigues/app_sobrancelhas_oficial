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
import { useUser } from '@/lib/auth';
import type { AnalysisImage } from '@/services/types';
import { consumeAnalysisCredit } from '@/services/credits';

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
  const { user } = useUser();
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
    setCapturedImages([]);
    setCurrentImage(null);
    setIsAnnotating(false);
    setSelectedClientId('');
    setAnalysisMode('single');
    setIsAnalyzing(false);
  }, [user?.id]);

  useEffect(() => {
    const fetchClients = async () => {
      setClients([]);

      if (!user?.id) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name')
          .eq('user_id', user.id)
          .order('name');
        
        if (error) {
          throw error;
        }

        setClients(data || []);
      } catch (err) {
        console.error('Erro ao buscar clientes:', err);
      }
    };

    fetchClients();
  }, [user?.id]);

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
    if (!user?.id) {
      showError('Sessão inválida. Faça login novamente.');
      return;
    }

    setIsPreparingImage(true);
    try {
      const file = dataURLtoFile(annotatedBase64, `annotated-${Date.now()}.jpg`);

      let imageUrl = annotatedBase64;
      let uploadSuccess = false;

      try {
        const uploadRes = await uploadPhotoToR2(file, {
          userId: user.id,
          folder: 'capturas',
        });

        if (uploadRes?.url) {
          imageUrl = uploadRes.url;
          uploadSuccess = true;
        }
      } catch (r2Error) {
        console.warn('R2 upload failed, keeping local image URL fallback:', r2Error);
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
    if (!user?.id) {
      showError('Sessão inválida. Faça login novamente.');
      return;
    }

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
      await consumeAnalysisCredit(user.id);

      const result = await performDualAnalysis(capturedImages, analysisMode);

      if (analysisMode === 'comparison') {
        result.isComparativo = true;
      }

      const insertData = {
        client_id: selectedClientId,
        user_id: user.id,
        image_url: capturedImages[capturedImages.length - 1].url,
        result,
      };

      const { error } = await supabase.from('analyses').insert([insertData]);

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
        mode={analysisMode}
        onSave={(img, boxes) => addImageToFlow(img, boxes)}
        onCancel={() => setIsAnnotating(false)}
      />
    );
  }

  const hasAtLeastOneImage = capturedImages.length >= 1;

  return (
    <div className="min-h-screen bg-[#1C3A2B] text-[#E8DECE] pb-28">
      <Navbar />

      <main className="mx-auto w-full max-w-md px-4 py-4 space-y-4">
        <header className="flex items-center justify-between gap-3 pt-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </button>

          <div className="text-center flex-1">
            <h1 className="font-heading text-lg font-normal">Análise Inteligente</h1>
          </div>

          <button onClick={resetFlow} className="p-2 rounded-full hover:bg-white/10 transition-colors text-red-300">
            <Trash2 size={18} />
          </button>
        </header>

        <Card className="border border-[#4A7A5C]/40 bg-[#3D6B52]/35 text-[#E8DECE] rounded-2xl shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-[#8FAF8A]">
              <User size={16} />
              <span className="font-label-category text-[9px]">Selecionar Cliente</span>
            </div>

            <div className="rounded-xl border border-[#4A7A5C] bg-[#1C3A2B]/30 px-3 py-2.5">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-transparent text-[#E8DECE] outline-none text-xs"
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

            <div className="grid grid-cols-3 gap-1.5">
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
                      'flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-[9px] font-bold transition-all text-center',
                      active
                        ? 'bg-[#4A7A5C] border-[#8FAF8A] text-[#E8DECE] shadow-md'
                        : 'bg-[#1C3A2B]/25 border-[#4A7A5C] text-[#8FAF8A] hover:bg-[#1C3A2B]/40',
                    )}
                  >
                    <Icon size={14} />
                    <span className="leading-tight">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#4A7A5C]/30 bg-[#1C3A2B]/70 text-[#E8DECE] rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-3">
            <div className="relative overflow-hidden rounded-xl border border-[#4A7A5C]/50 bg-[#10261C] min-h-[280px] flex items-center justify-center">
              {!currentImage ? (
                !hasAtLeastOneImage ? (
                  <div className="w-full flex items-center justify-center p-4 text-center">
                    <AnalysisModeIllustration mode={analysisMode} />
                  </div>
                ) : (
                  <div className="w-full p-4 flex flex-col justify-center gap-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {capturedImages.map((img, i) => (
                        <div
                          key={i}
                          className="w-24 rounded-xl overflow-hidden border border-[#4A7A5C] bg-[#1C3A2B] shadow-md"
                        >
                          <div className="aspect-[3/4]">
                            <img src={img.url} className="h-full w-full object-cover" alt={`Imagem ${i + 1}`} />
                          </div>
                          <div className="bg-[#4A7A5C] py-1 text-center text-[8px] font-label-category text-[#E8DECE]">
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
                      <h3 className="font-heading text-sm font-normal text-[#E8DECE]">Tudo pronto</h3>
                      <p className="mt-0.5 font-body text-[10px] text-[#8FAF8A]">Agora você pode gerar o diagnóstico.</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="relative w-full aspect-[3/4] max-h-[320px]">
                  <img src={currentImage} className="h-full w-full object-contain" alt="Imagem carregada" />
                  <div className="absolute inset-x-0 bottom-3 flex justify-center px-4 pointer-events-none">
                    <div className="pointer-events-auto rounded-xl border border-[#8FAF8A]/25 bg-[#4A7A5C]/90 px-3 py-2 text-center text-[#E8DECE] shadow-lg backdrop-blur-md">
                      <p className="text-[10px] font-bold">Foto carregada</p>
                      <p className="mt-0.5 text-[8px] uppercase tracking-wider opacity-80">
                        Clique em “Marcar” para prosseguir
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isPreparingImage && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md">
                  <Loader2 className="mb-2 h-8 w-8 animate-spin text-[#8FAF8A]" />
                  <p className="text-xs font-bold">Preparando imagem...</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                  <BrainCircuit className="mb-3 h-12 w-12 animate-pulse text-[#8FAF8A]" />
                  <p className="text-sm font-bold">Processando Diagnóstico...</p>
                  <p className="mt-1 text-[10px] text-slate-300">Analisando evolução técnica</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#D4C9B5] bg-[#E8DECE] text-[#1C3A2B] rounded-2xl shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="btn-elha-outline h-11 gap-1.5 text-xs"
              >
                <Upload size={14} />
                Upload
              </Button>

              <Button
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                className="btn-elha-outline h-11 gap-1.5 text-xs"
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
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="btn-elha-outline h-11 gap-1.5 text-xs"
                  onClick={() => setCurrentImage(null)}
                >
                  <RefreshCw size={14} />
                  Repetir
                </Button>

                <Button
                  className="btn-elha-primary h-11 gap-1.5 text-xs"
                  onClick={handleAnnotateImage}
                  disabled={isPreparingImage}
                >
                  <Pencil size={14} />
                  Marcar
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#D4C9B5] bg-[#F5F0E8] p-3 text-center">
                <p className="font-heading text-xs text-[#1C3A2B]">
                  {hasAtLeastOneImage ? 'Imagem pronta para análise' : 'Nenhuma imagem carregada'}
                </p>
                <p className="mt-0.5 text-[10px] text-[#4A7A5C]">
                  {hasAtLeastOneImage ? 'Clique abaixo para gerar o diagnóstico.' : 'Escolha uma imagem para começar.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {hasAtLeastOneImage && !currentImage && (
          <Button
            className="btn-elha-primary w-full h-12 gap-2 text-xs"
            onClick={handleConfirm}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
            Gerar Diagnóstico
          </Button>
        )}
      </main>
    </div>
  );
};

export default Capture;