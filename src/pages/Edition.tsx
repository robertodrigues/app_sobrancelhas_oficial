"use client";

import React, { useEffect, useRef, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Trash2, Upload } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { uploadPhotoToR2 } from "@/lib/r2";
import { useUser } from "@/lib/auth";
import { createUserStorageKey } from "@/lib/userStorage";

const Edition = () => {
  const { user } = useUser();
  const pdfLogoInputRef = useRef<HTMLInputElement>(null);
  const [pdfLogo, setPdfLogo] = useState<string | null>(null);
  const [pdfBgColor, setPdfBgColor] = useState("#DC2626");

  useEffect(() => {
    if (!user?.id) {
      setPdfLogo(null);
      setPdfBgColor("#DC2626");
      return;
    }

    setPdfLogo(localStorage.getItem(createUserStorageKey(user.id, "pdf_custom_logo")));
    setPdfBgColor(localStorage.getItem(createUserStorageKey(user.id, "pdf_custom_bg_color")) || "#DC2626");
  }, [user?.id]);

  const savePdfSettings = (logo: string | null, backgroundColor: string) => {
    if (!user?.id) return;

    const logoKey = createUserStorageKey(user.id, "pdf_custom_logo");
    const backgroundKey = createUserStorageKey(user.id, "pdf_custom_bg_color");

    if (logo) {
      localStorage.setItem(logoKey, logo);
    } else {
      localStorage.removeItem(logoKey);
    }

    localStorage.setItem(backgroundKey, backgroundColor);
    showSuccess("Ajustes do PDF salvos com sucesso!");
  };

  const handlePdfLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) {
      if (!user?.id) showError("Sessão inválida. Faça login novamente.");
      return;
    }

    try {
      const uploadRes = await uploadPhotoToR2(file, {
        userId: user.id,
        folder: "pdf-logo",
      });

      setPdfLogo(uploadRes.url);
      savePdfSettings(uploadRes.url, pdfBgColor);
      showSuccess("Logo do PDF enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar logo do PDF:", error);
      showError("Não foi possível enviar a logo do PDF.");
    }
  };

  const handleBackgroundColorChange = (value: string) => {
    setPdfBgColor(value);
    savePdfSettings(pdfLogo, value);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] pb-28">
      <Navbar />

      <main className="mx-auto w-full max-w-md space-y-6 px-4 py-8">
        <p className="px-2 text-center text-xs leading-relaxed text-[#4A7A5C]">
          O card abaixo representa a edição do PDF das suas análises quando ele é gerado. Portanto, você tem a opção de incluir a sua logo, com a cor do background da sua marca.
        </p>

        <Card className="overflow-hidden rounded-2xl border border-red-700 bg-red-600 text-white shadow-sm">
          <CardContent className="space-y-3 p-4">
            <h1 className="flex items-center gap-1.5 font-label-category text-[9px] text-white">
              <FileText size={14} className="text-red-200" />
              Ajuste do Relatório PDF
            </h1>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => pdfLogoInputRef.current?.click()}
                  variant="outline"
                  className="h-10 flex-1 border-red-800 bg-red-700 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-red-800"
                >
                  <Upload size={12} className="mr-1" />
                  Subir Logo PDF
                </Button>
                {pdfLogo && (
                  <Button
                    onClick={() => {
                      setPdfLogo(null);
                      savePdfSettings(null, pdfBgColor);
                    }}
                    variant="ghost"
                    className="h-10 w-10 shrink-0 rounded-xl p-0 text-red-200 hover:bg-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>

              <input
                type="file"
                ref={pdfLogoInputRef}
                onChange={handlePdfLogoUpload}
                accept="image/*"
                className="hidden"
              />

              {pdfLogo && (
                <div className="flex justify-center rounded-xl border border-white/20 bg-white/10 p-1.5">
                  <img src={pdfLogo} className="h-8 object-contain" alt="Logo do PDF" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="font-label-category text-[8px] text-white">Cor de Fundo do PDF</Label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={pdfBgColor}
                  onChange={(event) => handleBackgroundColorChange(event.target.value)}
                  className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border border-white/20"
                />
                <Input
                  value={pdfBgColor}
                  onChange={(event) => handleBackgroundColorChange(event.target.value)}
                  placeholder="#DC2626"
                  className="h-8 rounded-lg border-red-400 bg-white px-1.5 font-mono text-[10px] text-red-900 focus-visible:ring-red-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Edition;
