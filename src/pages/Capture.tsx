import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import Navbar from '@/components/layout/Navbar';
import CameraOverlay from '@/components/camera/CameraOverlay';
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
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { performDualAnalysis } from '@/services/analysis';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const Capture = () => {
  const [capturedImages, setCapturedImages] = useState<{url: string, bboxes: Record<string, RegionBBox>}[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [analysisMode, setAnalysisMode] = useState<'single' | 'comparison'>('single');
  
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from('clients').select('id, name').order('name');
      if (data) setClients(data);
    };
    fetchClients();
  }, []);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot({ width: 800, height: 600 });
    if (imageSrc) setCurrentImage(imageSrc);
  }, [webcamRef]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCurrentImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = async () => {
    if (!selectedClientId) {
      showError('Por favor, selecione um cliente.');
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

  const addImageToFlow = (url: string, bboxes: Record<string, RegionBBox>) => {
    setCapturedImages(prev => [...prev, { url, bboxes }]);
    setCurrentImage(null);
    setIsAnnotating(false);
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

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
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

      {/* Selectors */}
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

      {/* Main Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {!currentImage ? (
          <>
            {!hasAtLeastOneImage ? (
              <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
                <ImageIcon size={48} className="text-slate-700 mb-4" />
                <h3 className="text-white font-bold mb-2 text-sm">Suba a foto para análise</h3>
                <p className="text-slate-500 text-xs">
                  {analysisMode === 'comparison' 
                    ? 'Suba uma montagem (Antes/Depois) ou a foto atual' 
                    : 'Suba a foto da sobrancelha'}
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
                  
                  {analysisMode === 'comparison' && capturedImages.length < 2 && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-44 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-accent hover:text-accent transition-colors"
                    >
                      <Plus size={24} />
                      <span className="text-[10px] font-bold uppercase">Add Foto 2</span>
                    </button>
                  )}
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
            <img src={currentImage} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 text-center">
               <div className="bg-accent/90 backdrop-blur-md px-6 py-3 rounded-2xl text-white text-xs font-bold border border-white/20 shadow-2xl">
                 Foto Carregada!
                 <p className="text-[9px] opacity-80 mt-1 font-normal uppercase tracking-wider">Clique em "Marcar" para prosseguir</p>
               </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-50">
            <BrainCircuit className="w-16 h-16 animate-pulse text-accent mb-4" />
            <h2 className="text-base font-bold">Processando Diagnóstico...</h2>
            <p className="text-slate-400 text-xs mt-2">Analisando evolução técnica</p>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-slate-900 p-8 flex flex-col items-center gap-6">
        {!currentImage ? (
          !hasAtLeastOneImage || (analysisMode === 'comparison' && capturedImages.length < 2) ? (
            <div className="flex items-center gap-8">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                <Upload size={28} />
              </button>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">OU</div>
              <button 
                onClick={() => {
                  showError("Use o botão de Upload para as fotos");
                }} 
                className="w-16 h-16 bg-slate-800 text-white rounded-full flex items-center justify-center border border-slate-700 opacity-50"
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
                onClick={() => setIsAnnotating(true)}
              >
                <Pencil className="mr-2 h-4 w-4" /> Marcar
              </Button>
            </div>
          </div>
        )}

        {/* Botão de Gerar Diagnóstico aparece quando tem pelo menos 1 imagem */}
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

import { Plus } from 'lucide-react';

export default Capture;