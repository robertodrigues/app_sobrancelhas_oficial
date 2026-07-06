"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrientationSideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (side: "left" | "right") => void;
}

const OrientationSideDialog = ({
  open,
  onOpenChange,
  onSelect,
}: OrientationSideDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,420px)] rounded-[28px] border border-[#D4C9B5] bg-[#F5F0E8] p-0 shadow-2xl">
        <div className="px-5 pb-5 pt-6">
          <DialogHeader className="space-y-2 text-center">
            <DialogTitle className="font-heading text-xl font-normal text-[#1C3A2B]">
              Sobrancelha esquerda ou direita?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#4A7A5C]">
              Escolha o lado da imagem para que o ponto inicial, o meio e a cauda sejam atribuídos corretamente.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSelect("left")}
              className="h-16 rounded-2xl border-[#D4C9B5] bg-white text-[#1C3A2B] hover:bg-[#E8DECE]"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Sobrancelha Esquerda
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => onSelect("right")}
              className="h-16 rounded-2xl border-[#D4C9B5] bg-white text-[#1C3A2B] hover:bg-[#E8DECE]"
            >
              Sobrancelha Direita
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrientationSideDialog;