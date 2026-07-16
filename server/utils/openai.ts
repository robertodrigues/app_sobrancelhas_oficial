import type { AnalysisMode } from "../../src/services/types";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const hasObject = (value: Record<string, unknown>, key: string) => isObject(value[key]);
const hasString = (value: Record<string, unknown>, key: string) => isString(value[key]);
const hasNumber = (value: Record<string, unknown>, key: string) => isNumber(value[key]);
const hasBoolean = (value: Record<string, unknown>, key: string) => typeof value[key] === "boolean";
const hasArray = (value: Record<string, unknown>, key: string) => Array.isArray(value[key]);

const sanitizeJsonText = (text: string) =>
  text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u00A0\u202F\u2009\uFEFF]/g, " ")
    .replace(/[\u2026]/g, "...")
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .trim();

const extractJsonText = (text: string) => {
  const cleaned = sanitizeJsonText(text);
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("A resposta da IA não contém um objeto de dados válido.");
  }

  return match[0].trim();
};

export const parseAnalysisResult = (text: string) => {
  const jsonText = extractJsonText(text);
  return JSON.parse(jsonText);
};

const validateRegion = (value: unknown) => {
  if (!isObject(value)) return false;

  return hasString(value, "descricao") || hasString(value, "resumo") || hasObject(value, "densidade");
};

const validateSpecialistAnalysis = (value: unknown) => {
  if (!isObject(value)) return false;

  return hasString(value, "avaliacao_geral") || hasObject(value, "visaoGeral") || hasObject(value, "regioes");
};

const validateTricoscopiaAnalysis = (value: unknown) => {
  if (!isObject(value)) return false;

  return (
    hasString(value, "pilar_pele") &&
    hasString(value, "pilar_ostios") &&
    hasString(value, "pilar_fios") &&
    hasString(value, "avaliacao_geral")
  );
};

export const validateAnalysisResult = (value: unknown, mode: AnalysisMode) => {
  if (mode === "tricoscopia") {
    return validateTricoscopiaAnalysis(value);
  }

  return validateSpecialistAnalysis(value);
};

export const buildRepairMessages = (
  messages: Array<{ role: string; content: unknown }>,
  mode: AnalysisMode,
  previousResponse: string,
) => [
  ...messages,
  {
    role: "user",
    content: [
      {
        type: "text",
        text:
          `A resposta anterior não pôde ser lida. ` +
          `Retorne APENAS o objeto JSON corrigido. ` +
          `Resposta anterior:\n${previousResponse}`,
      },
    ],
  },
];