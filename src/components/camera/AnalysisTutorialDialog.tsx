import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HelpCircle, PlayCircle } from 'lucide-react';

interface AnalysisTutorialDialogProps {
  videoUrl?: string;
}

const toYouTubeEmbedUrl = (url: string) => {
  const trimmed = url.trim();

  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);

    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : trimmed;
    }

    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return trimmed;
      }

      const videoId = parsed.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : trimmed;
    }

    return trimmed;
  } catch {
    return trimmed;
  }
};

const AnalysisTutorialDialog = ({ videoUrl = '' }: AnalysisTutorialDialogProps) => {
  const [open, setOpen] = useState(false);
  const embedUrl = useMemo(() => toYouTubeEmbedUrl(videoUrl), [videoUrl]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full border border-[#FFB347]/40 bg-[radial-gradient(circle_at_30%_30%,#FFD089_0%,#FF9F1C_42%,#D97706_100%)] text-white shadow-[0_10px_22px_rgba(217,119,6,0.35),inset_0_2px_5px_rgba(255,255,255,0.35),inset_0_-6px_10px_rgba(120,53,15,0.28)] transition-transform hover:scale-105 active:scale-95"
          aria-label="Abrir tutorial da análise inteligente"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.35)]">
            <HelpCircle className="h-5 w-5 drop-shadow-sm" />
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] w-[min(92vw,420px)] overflow-hidden rounded-[32px] border border-[#D4C9B5] bg-[#F5F0E8] p-0 shadow-2xl">
        <div className="flex h-full max-h-[92vh] flex-col">
          <div className="bg-[linear-gradient(180deg,rgba(255,161,54,0.18)_0%,rgba(245,240,232,0)_100%)] px-5 pb-4 pt-5">
            <DialogHeader className="space-y-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#FFD089_0%,#FF9F1C_48%,#D97706_100%)] text-white shadow-[0_12px_26px_rgba(217,119,6,0.35),inset_0_2px_5px_rgba(255,255,255,0.35),inset_0_-7px_12px_rgba(120,53,15,0.28)]">
                <PlayCircle className="h-7 w-7" />
              </div>
              <DialogTitle className="font-heading text-xl font-normal text-[#1C3A2B]">
                Tutorial da Análise Inteligente
              </DialogTitle>
              <DialogDescription className="text-xs text-[#4A7A5C]">
                Veja como usar a interface antes de iniciar uma nova análise.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 pb-5">
            <div className="overflow-hidden rounded-[28px] border border-[#D4C9B5] bg-[#1C3A2B] shadow-[0_18px_40px_rgba(28,58,43,0.22)]">
              <div className="aspect-[9/16] w-full bg-black">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title="Tutorial em vídeo"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-[#E8DECE]">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#FFB347]">
                      <HelpCircle className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-heading text-base font-normal">Vídeo em breve</p>
                      <p className="text-xs text-[#8FAF8A]">
                        Me envie o link do YouTube depois que o vídeo estiver pronto, e eu conecto aqui.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#D4C9B5] bg-white/70 px-4 py-3 text-center">
              <p className="text-[11px] font-medium uppercase tracking-[2px] text-[#4A7A5C]">
                Modo Story Vertical
              </p>
              <p className="mt-1 text-xs text-[#1C3A2B]/80">
                Use este tutorial como guia rápido antes de começar.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnalysisTutorialDialog;