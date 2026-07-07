import { PROMPT_ESPECIALISTA, PROMPT_TRICOSCOPIA } from "../constants/prompt";
import type { AnalysisImage, AnalysisMode } from "./types";
import { jsonrepair } from "jsonrepair";
import { formatDensityRegionLabel } from "@/lib/densityRegion";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.elha.com.br";

type AnthropicMessageContent =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } };

const toDataUrl = async (source: string): Promise<string> => {
  if (source.startsWith("data:")) {
    return source;
  }

  const response = await fetch(source, { mode: "cors" });
  if (!response.ok) {
    throw new Error("Falha ao carregar imagem");
  }

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Erro ao converter imagem"));
    reader.readAsDataURL(blob);
  });
};

const compressDataUrl = (dataUrl: string, maxSize = 1280, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const needsResize = img.width > maxSize || img.height > maxSize;
      const scale = needsResize ? Math.min(maxSize / img.width, maxSize / img.height) : 1;

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Não foi possível preparar a imagem."));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => reject(new Error("Não foi possível otimizar a imagem."));
    img.src = dataUrl;
  });
};

const prepareImageDataUrl = async (source: string): Promise<string> => {
  const dataUrl = await toDataUrl(source);
  return compressDataUrl(dataUrl);
};

const sanitizeJsonText = (text: string) =>
  text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u00A0\u202F\u2009]/g, " ")
    .trim();

const extractJsonText = (text: string) => {
  const cleaned = sanitizeJsonText(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}") + 1;

  if (start === -1 || end <= start) {
    return cleaned;
  }

  return cleaned.slice(start, end).trim();
};

const parseValidatedJson = (text: string) => {
  const candidate = extractJsonText(text);

  try {
    return JSON.parse(candidate);
  } catch {
    const repaired = jsonrepair(candidate);
    return JSON.parse(repaired);
  }
};

const extractValidatedResult = (data: any) => {
  if (data?.result && typeof data.result === "object") {
    return data.result;
  }

  const text = data?.content?.[0]?.text;
  if (typeof text === "string") {
    return parseValidatedJson(text);
  }

  if (typeof data === "string") {
    return parseValidatedJson(data);
  }

  throw new Error("A resposta da IA veio vazia ou inválida.");
};

export const analyzeWithClaude = async (images: AnalysisImage[], mode: AnalysisMode = "single") => {
  try {
    const content: AnthropicMessageContent[] = [];
    const prompt = mode === "tricoscopia" ? PROMPT_TRICOSCOPIA : PROMPT_ESPECIALISTA;

    for (let i = 0; i < images.length; i += 1) {
      const label = images.length > 1 ? (i === 0 ? "ANTES" : "DEPOIS") : "VISÃO GERAL";
      const imageDataUrl = await prepareImageDataUrl(images[i].dataUrl || images[i].url);

      content.push({ type: "text", text: `Imagem ${i + 1}: ${label}` });
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: imageDataUrl.split(",")[1],
        },
      });

      console.log("bboxes recebidos para esta imagem:", images[i].bboxes);

      const ordemRegioes = ["ponto_inicial", "meio", "cauda"] as const;
      for (const name of ordemRegioes) {
        const box = images[i].bboxes[name];
        if (!box) continue;

        content.push({ type: "text", text: `Região: ${name.toUpperCase()}` });
      }

      if (images[i].densityRegion && images[i].densityRegion.length > 0) {
        const orderedLabels = ordemRegioes
          .filter((region) => images[i].densityRegion?.includes(region))
          .map((region) => formatDensityRegionLabel(region));

        content.push({
          type: "text",
          text: `Falha marcada pela profissional nas regiões: ${orderedLabels.join(", ")}`,
        });
      } else if (images[i].densityBBoxes?.falha) {
        content.push({
          type: "text",
          text:
            "Marca roxa da etapa de densidade registrada separadamente, mas a região não pôde ser identificada com segurança.",
        });
      }
    }

    const questionnaire = images[0]?.questionnaire;
    if (questionnaire) {
      content.push({
        type: "text",
        text: `Questionário respondido pela profissional:
- Tipo de falha: ${questionnaire.falha}
- Fios em crescimento: ${questionnaire.fiosEmCrescimento}`,
      });
    }

    content.push({ type: "text", text: prompt });

    const response = await fetch(`${API_BASE_URL}/api/anthropic`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content }],
        max_tokens: 2000,
        temperature: 0,
        analysisMode: mode,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    const result = extractValidatedResult(data);

    return {
      ...result,
      isComparativo: mode === "comparison" || images.length > 1,
      modoAnalise: mode,
    };
  } catch (error) {
    console.error("Erro Claude:", error);
    throw error;
  }
};