"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AnalysisNoteCardProps {
  value: string;
  onSave: (note: string) => Promise<boolean> | boolean;
  isSaving?: boolean;
}

const AnalysisNoteCard = ({ value, onSave, isSaving = false }: AnalysisNoteCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleSave = async () => {
    const result = await onSave(draft);
    if (result !== false) {
      setIsEditing(false);
    }
  };

  const displayValue = value.trim();
  const emptyState = "Clique em editar para adicionar uma nota ao relatório.";

  return (
    <Card className="overflow-hidden rounded-[30px] border border-[#D4C9B5] bg-[#E8DECE] shadow-[0_16px_40px_rgba(28,58,43,0.08)]">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#4A7A5C]">
            <Pencil size={16} />
            <span className="font-label-category text-[10px] tracking-[3px]">Nota livre</span>
          </div>

          {!isEditing ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-9 rounded-full px-3 text-xs text-[#1C3A2B] hover:bg-[#F5F0E8]"
            >
              <Pencil size={14} className="mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraft(value);
                  setIsEditing(false);
                }}
                className="h-9 rounded-full border-[#D4C9B5] bg-[#F5F0E8] px-3 text-xs text-[#1C3A2B] hover:bg-[#F5F0E8]"
                disabled={isSaving}
              >
                <X size={14} className="mr-2" />
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={cn("h-9 rounded-full px-3 text-xs", "btn-elha-primary")}
              >
                <Save size={14} className="mr-2" />
                Salvar
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escreva aqui a observação que deseja anexar ao relatório..."
              className="min-h-[140px] rounded-[24px] border-[#D4C9B5] bg-[#F5F0E8] text-[#1C3A2B] placeholder:text-[#4A7A5C]/60 focus-visible:ring-[#1C3A2B]"
            />
            <p className="text-[11px] text-[#4A7A5C]">Essa nota aparece no relatório e no PDF.</p>
          </div>
        ) : (
          <div className="min-h-[140px] rounded-[24px] border border-dashed border-[#D4C9B5] bg-[#F5F0E8] px-4 py-4">
            <p className={cn("whitespace-pre-wrap text-sm leading-relaxed", displayValue ? "text-[#1C3A2B]/90" : "text-[#4A7A5C]/80")}>
              {displayValue || emptyState}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalysisNoteCard;