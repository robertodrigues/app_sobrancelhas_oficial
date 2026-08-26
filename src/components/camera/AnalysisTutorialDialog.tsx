import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HelpCircle } from 'lucide-react';

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

const AnalysisTutorialDialog = ({
  videoUrl = 'https://mirvthmrjscgrifzbyrc.supabase.co/storage/v1/object/public/Tutorial/Elha%20Editado.mp4',
}: AnalysisTutorialDialogProps) => {
  const [open, setOpen] = useState(false);
  const embedUrl = useMemo(() => toYouTubeEmbedUrl(videoUrl), [videoUrl]);
  const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(embedUrl);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full border border-[#FFB347]/40 bg-[radial-gradient(circle_at_30%_30%,#FFD089_0%,#FF9F1C_42%,#D97706_100%)] text-white shadow-[0_8px_18px_rgba(217,119,6,0.32),inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-5px_9px_rgba(120,53,15,0.28)] transition-transform hover:scale-105 active:scale-95"
          aria-label="Abrir tutorial da análise inteligente"
        >
          <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.35)]">
            <HelpCircle className="h-4 w-4 drop-shadow-sm" />
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] w-[min(92vw,420px)] overflow-hidden rounded-[32px] border border-[#D4C9B5] bg-[#F5F0E8] p-0 shadow-2xl">
        <div className="overflow-hidden rounded-[32px] bg-black">
          <div className="w-full bg-black">
            {embedUrl ? (
              isDirectVideo ? (
                <video
                  src={embedUrl}
                  title="Tutorial em vídeo"
                  className="mx-auto block max-h-[92vh] w-auto max-w-full object-contain"
                  controls
                  playsInline
                />
              ) : (
                <iframe
                  src={embedUrl}
                  title="Tutorial em vídeo"
                  className="h-[70vh] w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnalysisTutorialDialog;