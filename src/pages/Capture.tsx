import React, { useState, useRef, useCallback, useEffect } from 'react';
import ImageAnnotator, { RegionBBox } from '@/components/camera/ImageAnnotator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { performDualAnalysis } from '@/services/analysis';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { uploadPhotoToR2 } from '@/lib/r2';

const EyebrowSVG = ({ className = "w-32 h-12 text-accent" }: { className?: string }) => (
  <svg viewBox="0 0 100 30" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M10,22 C25,12 45,8 65,12 C75,14 85,18 90,24 C80,20 70,16 60,15 C40,13 25,17 10,22 Z" 
      fill="currentColor" 
    />
  </svg>
);

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

const Capture = () => {
  const [capturedImages, setCapturedImages] = useState<{url: string, bboxes: Record<string, RegionBBox>}[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [analysisMode, setAnalysisMode] = useState<'single' | 'comparison'>('single');
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  
  const webcamRef = useRef<any>(null);

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

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot({ width: 1920, height: 1080 });
    if (imageSrc) setCurrentImage(imageSrc);
  }, [webcamRef]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsPreparingImage(true);
    try {
      const optimizedImage = await resizeImageIfNeeded(file);
      setCurrentImage(optimizedImage);
      setCurrentImageFile(file);
    } catch (error: any) {
      showError(error.message || 'Não foi possível carregar a foto.');
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

      const { error } = await supabase.from('analyses').insert([{
        client_id: selectedClientId,
        image_url: capturedImages[capturedImages.length - 1].url,
        result: result
      }]);

      if (error) throw error;

      showSuccess('Análise concluída!');
      navigate('/resultado', { 
        state: { 
          analysis: result, 
          image: capturedImages[capturedImages.length - 1].url, 
          allImages: capturedImages 
        } 
      });
    } catch (error: any) {
      showError("Falha na análise: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addImageToFlow = async (url: string, bboxes: Record<string, RegionBBox>) => {
    setCapturedImages(prev => [...prev, { url, bboxes }]);
    setCurrentImage(null);
    setCurrentImageFile(null);
    setIsAnnotating(false);
  };

  const handleAnnotateImage = async () => {
    if (!currentImageFile && !currentImage) {
      showError('Selecione uma imagem antes de marcar.');
      return;
    }

    setIsPreparingImage(true);
    try {
      const url = currentImage || (currentImageFile ? (await uploadPhotoToR2(currentImageFile)).url : null);
      if (!url) {
        showError('Não foi possível carregar a imagem.');
        return;
      }
      setCurrentImage(url);
      setIsAnnotating(true);
    } catch (error: any) {
      showError(error.message || 'Não foi possível enviar a foto.');
    } finally {
      setIsPreparingImage(false);
    }
  };

  const resetFlow = () => {
    setCapturedImages([]);
    setCurrentImage(null);
    setCurrentImageFile(null);
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

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="p-4 flex items-center justify-between text-white z-10 relative">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold">
            {analysisMode === 'comparison' ? 'Comparação Técnica' : 'Captura Técnica'}
          </h1>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">Diagnóstico Capilar</p>
        </div>
        <button onClick={resetFlow} className="p-2 hover:bg-white/10 rounded-full text-red-400">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="px-6 py-2 z-10 space-y-3">
        <Select onValueChange={setSelectedClientId} value={selectedClientId}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 rounded-xl">
            <div className="flex items-center gap-2">
              <User size={18} className="text-accent" />
              <SelectValue placeholder="Selecionar Cliente" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
          <button
            onClick={() => { setAnalysisMode('single'); setCapturedImages([]); }}
            className={cn("flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all", analysisMode === 'single' ? "bg-accent text-white shadow-lg" : "text-slate-400")}
          >
            <FileText size={14} /> Sem Comparações
          </button>
          <button
            onClick={() => { setAnalysisMode('comparison'); setCapturedImages([]); }}
            className={cn("flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all", analysisMode === 'comparison' ? "bg-accent text-white shadow-lg" : "text-slate-400")}
          >
            <Columns size={14} /> Com Comparações
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {!currentImage ? (
          <>
            {!hasAtLeastOneImage ? (
              <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-48 h-48 rounded-3xl border-2 border-dashed border-slate-700 bg-slate-800/30 flex flex-col items-center justify-center p-4 mb-6 transition-all duration-300">
                  {analysisMode === 'single' ? (
                    <div className="flex flex-col items-center gap-2">
                      <EyebrowSVG className="w-36 h-14 text-accent" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1 Sobrancelha</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex flex-col gap-1 items-center">
                        <EyebrowSVG className="w-28 h-10 text-slate-500 opacity-60" />
                        <EyebrowSVG className="w-28 h-10 text-accent" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Antes & Depois</span>
                    </div>
                  )}
                </div>

                <h3 className="text-white font-bold mb-2 text-sm">Suba a foto para análise</h3>
                <p className="text-slate-500 text-xs max-w-xs">
                  {analysisMode === 'comparison' 
                    ? 'Suba uma montagem contendo o Antes e Depois' 
                    : 'Suba a foto da sobrancelha atual'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 p-8 text-center">
                <div className="flex gap-4 flex-wrap justify-center">
                  {capturedImages.map((img, i) => (
                    <div key={i} className="relative w-32 h-44 rounded-2xl overflow-hidden border-2 border-accent shadow-xl">
                      <img src={img.url} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-accent text-white text-[10px] font-bold py-1 uppercase">
                        {analysisMode === 'comparison' ? 'Montagem/Foto' : 'Captura'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-white">
                  <h3 className="text-sm font-bold">Tudo Pronto!</h3>
                  <p className="text-slate-400 text-xs">Clique abaixo para iniciar o diagnóstico.</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="relative h-full w-full">
            <img src={currentImage} className="h-full w-full object-contain" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 text-center">
               <div className="bg-accent/90 backdrop-blur-md px-6 py-3 rounded-2xl text-white text-xs font-bold border border-white/20 shadow-2xl">
                 Foto Carregada!
                 <p className="text-[9px] opacity-80 mt-1 font-normal uppercase tracking-wider">Clique em "Marcar" para prosseguir</p>
               </div>
            </div>
          </div>
        )}

        {isPreparingImage && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center text-white z-50">
            <Loader2 className="w-10 h-10 animate-spin text-accent mb-3" />
            <h2 className="text-sm font-bold">Preparando imagem...</h2>
          </div>
        )}

        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-50">
            <BrainCircuit className="w-16 h-16 animate-pulse text-accent mb-4" />
            <h2 className="text-base font-bold">Processando Diagnóstico...</h2>
            <p className="text-slate-400 text-xs mt-2">Analisando evolução técnica</p>
          </div>
        )}
      </div>

      <div className="bg-slate-900 p-8 flex flex-col items-center gap-6">
        {!currentImage ? (
          !hasAtLeastOneImage ? (
            <div className="flex items-center gap-8">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <input type="file" ref={cameraInputRef} onChange={handleFileUpload} accept="image/*" capture="environment" className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                <Upload size={28} />
              </button>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">OU</div>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-16 h-16 bg-slate-800 text-white rounded-full flex items-center justify-center border border-slate-700 active:scale-90 transition-transform"
              >
                <Camera size={28} />
              </button>
            </div>
          ) : null
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 bg-transparent border-white text-white h-14 rounded-2xl text-xs" 
                onClick={() => setCurrentImage(null)}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Repetir
              </Button>
              <Button 
                className="flex-1 bg-accent hover:bg-accent/90 h-14 rounded-2xl shadow-xl shadow-accent/20 text-xs" 
                onClick={handleAnnotateImage}
                disabled={isPreparingImage}
              >
                <Pencil className="mr-2 h-4 w-4" /> Marcar
              </Button>
            </div>
          </div>
        )}

        {hasAtLeastOneImage && !currentImage && (
          <Button 
            className="w-full h-14 bg-accent hover:bg-accent/90 text-sm font-bold rounded-2xl shadow-lg shadow-accent/20" 
            onClick={handleConfirm} 
            disabled={isAnalyzing}
          >
            {isAnalyzing ? <Loader2 className="animate-spin" /> : <><Check className="mr-2 h-5 w-5" /> Gerar Diagnóstico</>}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Capture;