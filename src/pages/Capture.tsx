import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Navbar from '@/components/layout/Navbar';
import CameraOverlay from '@/components/camera/CameraOverlay';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Check, ArrowLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

const Capture = () => {
  const [side, setSide] = useState<'left' | 'right'>('right');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('Por favor, selecione um arquivo de imagem válido.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
        showSuccess('Imagem carregada com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSave = () => {
    showSuccess(`Foto da sobrancelha ${side === 'right' ? 'direita' : 'esquerda'} salva!`);
    if (side === 'right') {
      setSide('left');
      setCapturedImage(null);
    } else {
      navigate('/');
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
                aspectRatio: 3/4
              }}
              className="h-full w-full object-cover"
            />
            <CameraOverlay side={side} />
          </>
        ) : (
          <img src={capturedImage} alt="Captura" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="bg-slate-900 p-8 flex flex-col items-center gap-6">
        {!capturedImage ? (
          <div className="flex items-center gap-8">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button
              onClick={triggerFileUpload}
              className="w-14 h-14 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform border border-slate-700"
              title="Upload da Galeria"
            >
              <Upload size={24} />
            </button>

            <button
              onClick={capture}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"
              title="Tirar Foto"
            >
              <div className="w-16 h-16 border-4 border-slate-900 rounded-full"></div>
            </button>

            <div className="w-14"></div> {/* Spacer para equilibrar o layout */}
          </div>
        ) : (
          <div className="flex gap-4 w-full max-w-xs">
            <Button 
              variant="outline" 
              className="flex-1 bg-transparent border-white text-white hover:bg-white/10"
              onClick={() => setCapturedImage(null)}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Repetir
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleSave}
            >
              <Check className="mr-2 h-4 w-4" /> Confirmar
            </Button>
          </div>
        )}
        <p className="text-slate-400 text-xs text-center">
          Use a câmera para captura técnica ou faça upload de uma foto da galeria.
        </p>
      </div>
    </div>
  );
};

export default Capture;