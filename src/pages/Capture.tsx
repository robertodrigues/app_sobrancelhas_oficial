import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import Navbar from '@/components/layout/Navbar';
import CameraOverlay from '@/components/camera/CameraOverlay';
import ImageAnnotator from '@/components/camera/ImageAnnotator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, RefreshCw, Check, ArrowLeft, Upload, Loader2, User, BrainCircuit, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { performDualAnalysis } from '@/services/analysis';
import { supabase } from '@/lib/supabase';

const Capture = () => {
  const [side, setSide] = useState<'left' | 'right'>('right');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
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
    const imageSrc = webcamRef.current?.getScreenshot({ width: 1200, height: 900 });
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = async () => {
    const imageToAnalyze = annotatedImage || capturedImage;
    if (!imageToAnalyze) return;
    
    if (!selectedClientId) {
      showError('Por favor, selecione um cliente antes de analisar.');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const result = await performDualAnalysis(imageToAnalyze);
      
      const { error } = await supabase.from('analyses').insert([{
        client_id: selectedClientId,
        image_url: imageToAnalyze,
        result: result
      }]);

      if (error) throw error;

      showSuccess('Análise de alta precisão concluída!');
      navigate('/resultado', { state: { analysis: result, image: imageToAnalyze } });
    } catch (error: any) {
      showError("Erro na análise: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnnotating && capturedImage) {
    return (
      <ImageAnnotator 
        image={capturedImage} 
        onSave={(img) => {
          setAnnotatedImage(img);
          setIsAnnotating(false);
        }}
        onCancel={() => setIsAnnotating(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="p-4 flex items-center justify-between text-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-semibold">Captura Técnica</h1>
        <div className="w-10"></div>
      </div>

      <div className="px-6 py-2 z-10">
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
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {!capturedImage ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'environment', width: 1200, height: 900 }}
              className="h-full w-full object-cover"
            />
            <CameraOverlay side={side} />
          </>
        ) : (
          <div className="relative h-full w-full">
            <img src={annotatedImage || capturedImage} alt="Captura" className="h-full w-full object-cover" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
                <BrainCircuit className="w-16 h-16 animate-pulse text-accent mb-4" />
                <h2 className="text-xl font-bold mb-2">Dual AI Processing</h2>
                <p className="text-sm text-slate-300">Analisando marcações coloridas para máxima precisão...</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-900 p-8 flex flex-col items-center gap-6">
        {!capturedImage ? (
          <div className="flex items-center gap-8">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-14 h-14 bg-slate-800 text-white rounded-full flex items-center justify-center border border-slate-700">
              <Upload size={24} />
            </button>
            <button onClick={capture} className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
              <div className="w-16 h-16 border-4 border-slate-900 rounded-full"></div>
            </button>
            <div className="w-14"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 bg-transparent border-white text-white hover:bg-white/10"
                onClick={() => { setCapturedImage(null); setAnnotatedImage(null); }}
                disabled={isAnalyzing}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Repetir
              </Button>
              <Button 
                variant="outline"
                className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                onClick={() => setIsAnnotating(true)}
                disabled={isAnalyzing}
              >
                <Pencil className="mr-2 h-4 w-4" /> {annotatedImage ? "Editar" : "Marcar"}
              </Button>
            </div>
            <Button 
              className="w-full h-12 bg-accent hover:bg-accent/90 text-lg font-bold"
              onClick={handleConfirm}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? <Loader2 className="animate-spin" /> : <><Check className="mr-2 h-4 w-4" /> Analisar Agora</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Capture;