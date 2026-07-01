import { RegionBBox } from "@/components/camera/ImageAnnotator";
import { PROMPT_ESPECIALISTA, PROMPT_TRICOSCOPIA } from "../constants/prompt";
import type { AnalysisImage, AnalysisMode } from "./types";
import { jsonrepair } from "jsonrepair";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.elha.com.br";

const DARK_THRESHOLD = 100;

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

const calculateDensityFromCanvas = (canvas: HTMLCanvasElement): number => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Erro ao criar contexto canvas");
  }

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  console.log("Canvas dimensões:", canvas.width, canvas.height);
  console.log("Amostra de pixels:", data[0], data[1], data[2], data[3], "|", data[400], data[401], data[402], data[403]);

  const luminances: number[] = [];
  let totalLuminance = 0;
  let totalPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) {
      continue;
    }

    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    luminances.push(luminance);
    totalLuminance += luminance;
    totalPixels += 1;
  }

  if (totalPixels === 0) {
    return 0;
  }

  luminances.sort((a, b) => a - b);
  const quantileIndex = (quantile: number) => Math.min(luminances.length - 1, Math.max(0, Math.floor(luminances.length * quantile)));
  const darkRef = luminances[quantileIndex(0.15)];
  const midRef = luminances[quantileIndex(0.5)];
  const brightRef = luminances[quantileIndex(0.85)];
  const averageLuminance = totalLuminance / totalPixels;
  const brightnessSpread = Math.max(1, brightRef - darkRef);
  const contrastSpread = Math.max(1, brightRef - midRef);

  const adaptiveThreshold = Math.max(55, Math.min(DARK_THRESHOLD, brightRef - brightnessSpread * 0.35));
  let darkPixels = 0;

  for (const luminance of luminances) {
    if (luminance < adaptiveThreshold) {
      darkPixels += 1;
    }
  }

  const darkCoverage = darkPixels / totalPixels;
  const contrastScore = Math.max(0, Math.min(1, (brightRef - averageLuminance) / brightnessSpread));
  const midToneScore = Math.max(0, Math.min(1, contrastSpread / brightnessSpread));
  const highlightPenalty = Math.max(0, Math.min(1, (averageLuminance - brightRef) / 255));
  const densityScore = Math.max(0, Math.min(1, darkCoverage * 0.5 + contrastScore * 0.3 + midToneScore * 0.2 - highlightPenalty * 0.15));

  return Math.round(densityScore * 100);
};

const cropImage = async (base64Str: string, bbox: RegionBBox): Promise<{ dataUrl: string; density: number }> => {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = base64Str;
  });

  if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
    console.error("Imagem inválida ou não carregada corretamente:", {
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
    });
    throw new Error("Imagem não carregou corretamente antes do recorte.");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Erro ao criar contexto canvas");
  }

  const padding = 28;
  const imgWidth = img.naturalWidth || img.width;
  const imgHeight = img.naturalHeight || img.height;
  const bboxIsNormalized = bbox.maxX <= 1 && bbox.maxY <= 1 && bbox.minX >= 0 && bbox.minY >= 0;
  const scaleX = bboxIsNormalized ? imgWidth : 1;
  const scaleY = bboxIsNormalized ? imgHeight : 1;

  const scaledMinX = bbox.minX * scaleX;
  const scaledMinY = bbox.minY * scaleY;
  const scaledMaxX = bbox.maxX * scaleX;
  const scaledMaxY = bbox.maxY * scaleY;

  const x = Math.max(0, scaledMinX - padding);
  const y = Math.max(0, scaledMinY - padding);
  const expectedWidth = scaledMaxX - scaledMinX + padding * 2;
  const expectedHeight = scaledMaxY - scaledMinY + padding * 2;
  const width = Math.min(imgWidth - x, expectedWidth);
  const height = Math.min(imgHeight - y, expectedHeight);

  if (width <= 0 || height <= 0) {
    console.warn("Recorte inválido após normalização da bbox:", {
      bbox,
      imgWidth,
      imgHeight,
      x,
      y,
      width,
      height,
      bboxIsNormalized,
    });
    throw new Error("Recorte inválido para a imagem atual.");
  }

  if (width < expectedWidth * 0.5 || height < expectedHeight * 0.5) {
    console.warn("Possível mismatch de escala entre bbox e imagem:", {
      width,
      height,
      expectedWidth,
      expectedHeight,
      imgWidth,
      imgHeight,
      bbox,
      bboxIsNormalized,
    });
  }

  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  console.log("Origem da imagem (src):", img.src.slice(0, 60));
  ctx.drawImage(img, x, y, width, height, 0, 0, canvas.width, canvas.height);

  let density = 0;
  try {
    density = calculateDensityFromCanvas(canvas);
  } catch (err) {
    console.error("Erro ao calcular densidade (possível CORS taint):", err);
    throw err;
  }

  console.log("Densidade calculada:", density, "BBox:", bbox);
  const dataUrl = await compressDataUrl(canvas.toDataURL("image/jpeg", 0.82), 900, 0.78);

  return { dataUrl, density };
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

      for (const [name, box] of Object.entries(images[i].bboxes)) {
        const { dataUrl: croppedData, density } = await cropImage(imageDataUrl, box);
        console.log(`Densidade: ${name}`, density);
        content.push({ type: "text", text: `Densidade calculada automaticamente para esta região: ${density}%` });
        content.push({ type: "text", text: `Detalhe ${label} - Região ${name.toUpperCase()}` });
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: croppedData.split(",")[1],
          },
        });
      }

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