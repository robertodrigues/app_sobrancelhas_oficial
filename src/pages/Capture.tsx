import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Navbar from '@/components/layout/Navbar';
import CameraOverlay from '@/components/camera/CameraOverlay';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Check, ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { analyzeEyebrow } from '@/services/gemini';

const Capture = () => {
  const [side, setSide] = useState<'left' | 'right'>('right');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const capture = useCallback(() => {
    // Captura com resolução balanceada para não sobrecarregar a API
    const imageSrc = webcamRef.current?.getScreenshot({ width: 800, height: 600 });
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
    if (!capturedImage) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeEyebrow(capturedImage);
      showSuccess('Análise concluída!');
      navigate('/resultado', { state: { analysis: result, image: capturedImage } });
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="p-4 flex items-center justify-between text-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-semibold">Captura Técnica</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {!capturedImage ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ 
                facingMode: 'environment',
                width: 800,
                height: 600
              }}
              className="h-full w-full object-cover"
            />
            <CameraOverlay side={side} />
          </>
        ) : (
          <div className="relative h-full w-full">
            <img src={capturedImage} alt="Captura" className="h-full w-full object-cover" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
                <h2 className="text-xl font-bold mb-2">IA Analisando...</h2>
                <p className="text-sm text-slate-300">Processando detalhes da sobrancelha.</p>
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
          <div className="flex gap-4 w-full max-w-xs">
            <Button 
              variant="outline" 
              className="flex-1 bg-transparent border-white text-white hover:bg-white/10"
              onClick={() => setCapturedImage(null)}
              disabled={isAnalyzing}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Repetir
            </Button>
            <Button 
              className="flex-1 bg-accent hover:bg-accent/90"
              onClick={handleConfirm}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? <Loader2 className="animate-spin" /> : <><Check className="mr-2 h-4 w-4" /> Analisar</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Capture;