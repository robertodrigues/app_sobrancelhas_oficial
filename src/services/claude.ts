import { PROMPT_SEM_COMPARAÇÕES, PROMPT_COM_COMPARAÇÕES } from "../constants/prompt";
import { jsonrepair } from "jsonrepair";
import { formatDensityRegionLabel } from "@/lib/densityRegion";
import type { AnalysisImage, AnalysisMode, TricoscopiaQuestionnaire } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.elha.com.br";

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
    .replace(/[\u00A0\u202F\u2009\uFEFF]/g, " ")
    .trim();

const extractJsonText = (text: string) => {
  const cleaned = sanitizeJsonText(text);
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    return match[0].trim();
  }
  throw new Error("A resposta da IA veio em formato inesperado: " + cleaned.slice(0, 100));
};

const parseValidatedJson = (text: string) => {
  const candidate = text.trim().startsWith("{") ? text.trim() : `{${text.trim()}`;
  const extracted = extractJsonText(candidate);

  try {
    return JSON.parse(extracted);
  } catch {
    try {
      const repaired = jsonrepair(extracted);
      return JSON.parse(repaired);
    } catch {
      console.error("Falha ao parsear JSON:", { original: text, candidate });
      throw new Error("A resposta da IA não pôde ser interpretada como um relatório técnico.");
    }
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

const formatComparisonEvolution = (value: string | undefined) => {
  switch (value) {
    case "sem_evolucao":
      return "Sem evolução";
    case "discreta":
      return "Discreta";
    case "moderada":
      return "Moderada";
    case "evidente":
      return "Evidente";
    case "piora":
      return "Piora";
    default:
      return "";
  }
};

const formatTricoscopiaRegion = (value: string | undefined) => {
  switch (value) {
    case "ponto_inicial":
      return "Início";
    case "meio":
      return "Meio";
    case "cauda":
      return "Cauda";
    default:
      return "";
  }
};

const formatTricoscopiaList = (values: string[] = []) => {
  const mapping: Record<string, string> = {
    vermelhidao: "Vermelhidão",
    descamacao_perifolicular: "Descamação ao redor do óstio (perifolicular)",
    descamacao_interfolicular: "Descamação entre os óstios (interfolicular)",
    oleosidade: "Oleosidade",
    ressecamento: "Ressecamento",
    ostio_sem_fio_visivel: "Óstio sem fio visível",
    ostio_amarelo: "Óstio amarelo",
    halo_perifolicular: "Halo perifolicular (vermelhidão ao redor do óstio)",
    ostio_preto: "Óstio preto (fio quebrado junto à abertura folicular)",
    fios_espessura_diferente: "Fios de espessura diferente entre si",
    fios_miniaturizados: "Fios miniaturizados (mais finos que o habitual)",
    fios_novos_nascendo: "Fios novos nascendo",
    fios_quebrados: "Fios quebrados",
    sem_alteracoes: "Sem alterações",
  };

  if (values.includes("sem_alteracoes")) {
    return ["Sem alterações"];
  }

  return values.map((value) => mapping[value] || value).filter(Boolean);
};

export const analyzeWithClaude = async (images: AnalysisImage[], mode: AnalysisMode = "single") => {
  try {
    const content: AnthropicMessageContent[] = [];
    const prompt =
      mode === "tricoscopia"
        ? `
Você é um assistente especializado em documentação técnica de avaliações de tricoscopia de sobrancelhas.

RESPONDA SOMENTE EM JSON VÁLIDO, sem markdown, sem texto fora do JSON, seguindo exatamente esta estrutura:

{
  "pilar_pele": "texto",
  "pilar_ostios": "texto",
  "pilar_fios": "texto",
  "avaliacao_geral": "texto"
}

Use português do Brasil, linguagem técnica, frases curtas e objetivas.
Não mencione diagnóstico.
Não mencione recomendações de tratamento.
`
        : mode === "comparison"
          ? PROMPT_COM_COMPARAÇÕES
          : PROMPT_SEM_COMPARAÇÕES;

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

      if (mode === "tricoscopia") {
        const tricoscopia = images[i].tricoscopiaQuestionnaire;
        if (tricoscopia) {
          content.push({
            type: "text",
            text: [
              `Região analisada: ${formatTricoscopiaRegion(tricoscopia.regiao)}`,
              `Pele: ${formatTricoscopiaList(tricoscopia.pilarPele).join(", ")}`,
              `Óstios: ${formatTricoscopiaList(tricoscopia.pilarOstios).join(", ")}`,
              `Fios: ${formatTricoscopiaList(tricoscopia.pilarFios).join(", ")}`,
            ].join("\n"),
          });
        }
        continue;
      }

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
      }

      if (images[i].densityBBoxes?.falha) {
        content.push({
          type: "text",
          text: "densityBBoxes.falha: região de falha destacada pela profissional.",
        });
      }
    }

    const questionnaire = images[0]?.questionnaire;
    if (questionnaire && mode !== "tricoscopia") {
      const lines: string[] = [
        `Questionário respondido pela profissional:`,
        `- Tipo de falha: ${questionnaire.falha}`,
        `- Fios em crescimento: ${questionnaire.fiosEmCrescimento.join(", ")}`,
      ];

      if (mode === "comparison") {
        const comparisonEvolution = questionnaire.comparisonEvolution;
        if (comparisonEvolution) {
          lines.push(
            `- Evolução por região: ` +
              `início=${formatComparisonEvolution(comparisonEvolution.ponto_inicial)}, ` +
              `meio=${formatComparisonEvolution(comparisonEvolution.meio)}, ` +
              `cauda=${formatComparisonEvolution(comparisonEvolution.cauda)}`,
          );
        }

        if (questionnaire.growthArea?.length) {
          lines.push(`- Regiões com crescimento e novos fios: ${questionnaire.growthArea.join(", ")}`);
        }

        if (questionnaire.evolutionFeatures?.length) {
          lines.push(`- Características da evolução: ${questionnaire.evolutionFeatures.join(", ")}`);
        }
      }

      content.push({
        type: "text",
        text: lines.join("\n"),
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