export type AnalysisMode = "single" | "comparison" | "tricoscopia";

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
    .replace(/[\u00A0\u202F\u2009]/g, " ")
    .replace(/[\u2026]/g, "...")
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .trim();

const extractJsonText = (text: string) => {
  const cleaned = sanitizeJsonText(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}") + 1;

  if (start === -1 || end <= start) {
    throw new Error("A resposta não contém um JSON válido.");
  }

  return cleaned.slice(start, end).trim();
};

export const parseAnalysisResult = (text: string) => {
  const jsonText = extractJsonText(text);
  return JSON.parse(jsonText);
};

const validateRegion = (value: unknown) => {
  if (!isObject(value)) return false;

  return (
    hasString(value, "descricao") &&
    hasObject(value, "densidade") &&
    hasString(value.densidade as Record<string, unknown>, "classificacao") &&
    hasNumber(value.densidade as Record<string, unknown>, "percentual") &&
    typeof value.peleExposta === "boolean" &&
    hasString(value, "peleDescricao") &&
    hasString(value, "espessura") &&
    hasString(value, "direcaoFios") &&
    hasString(value, "caracteristicasEspeciais") &&
    hasObject(value, "escalaDano") &&
    hasNumber(value.escalaDano as Record<string, unknown>, "percentual") &&
    hasString(value.escalaDano as Record<string, unknown>, "classificacao") &&
    hasString(value, "prognostico") &&
    hasObject(value, "statusMelhoria") &&
    hasString(value.statusMelhoria as Record<string, unknown>, "cor") &&
    hasString(value.statusMelhoria as Record<string, unknown>, "descricao")
  );
};

const validateSpecialistAnalysis = (value: unknown) => {
  if (!isObject(value)) return false;

  return (
    hasBoolean(value, "isComparativo") &&
    hasObject(value, "alertaInterno") &&
    hasBoolean(value.alertaInterno as Record<string, unknown>, "presente") &&
    hasString(value.alertaInterno as Record<string, unknown>, "descricao") &&
    hasObject(value, "regioes") &&
    hasObject(value.regioes as Record<string, unknown>, "inicio") &&
    hasObject(value.regioes as Record<string, unknown>, "meio") &&
    hasObject(value.regioes as Record<string, unknown>, "cauda") &&
    validateRegion((value.regioes as Record<string, unknown>).inicio) &&
    validateRegion((value.regioes as Record<string, unknown>).meio) &&
    validateRegion((value.regioes as Record<string, unknown>).cauda) &&
    hasObject(value, "visaoGeral") &&
    hasString(value.visaoGeral as Record<string, unknown>, "descricao") &&
    hasString(value.visaoGeral as Record<string, unknown>, "resumoTecnico") &&
    hasString(value.visaoGeral as Record<string, unknown>, "objetivo") &&
    hasObject(value, "comparativo") &&
    hasString(value.comparativo as Record<string, unknown>, "evolucaoGeral") &&
    hasNumber(value.comparativo as Record<string, unknown>, "melhoriaPercentualEstimada") &&
    hasString(value.comparativo as Record<string, unknown>, "destaquePositivo")
  );
};

const validateTricoscopiaAnalysis = (value: unknown) => {
  if (!isObject(value)) return false;

  return (
    hasString(value, "modoAnalise") &&
    hasString(value, "regiaoAnalisada") &&
    hasObject(value, "analiseDaPele") &&
    hasString(value.analiseDaPele as Record<string, unknown>, "descamacaoInterfolicular") &&
    hasString(value.analiseDaPele as Record<string, unknown>, "descamacaoPerifolicular") &&
    hasString(value.analiseDaPele as Record<string, unknown>, "coloracaoDescamacao") &&
    hasString(value.analiseDaPele as Record<string, unknown>, "peleComEritema") &&
    hasString(value.analiseDaPele as Record<string, unknown>, "presencaDeLesoes") &&
    hasString(value.analiseDaPele as Record<string, unknown>, "peleCraquelada") &&
    hasString(value.analiseDaPele as Record<string, unknown>, "aspectoSaudavel") &&
    hasString(value.analiseDaPele as Record<string, unknown>, "aspectoOleoso") &&
    hasString(value.analiseDaPele as Record<string, unknown>, "sinaisProcedimentosAgressivos") &&
    hasString(value.analiseDaPele as Record<string, unknown>, "conclusao") &&
    hasObject(value, "analiseDosFios") &&
    hasString(value.analiseDosFios as Record<string, unknown>, "fioReferencia") &&
    hasString(value.analiseDosFios as Record<string, unknown>, "classificacaoFiosPresentes") &&
    hasString(value.analiseDosFios as Record<string, unknown>, "pigmentacao") &&
    hasString(value.analiseDosFios as Record<string, unknown>, "quantidadeDistribuicao") &&
    hasObject(value, "analiseDosOstiosFoliculares") &&
    hasString(value.analiseDosOstiosFoliculares as Record<string, unknown>, "ostioVazio") &&
    hasString(value.analiseDosOstiosFoliculares as Record<string, unknown>, "ostioComFio") &&
    hasString(value.analiseDosOstiosFoliculares as Record<string, unknown>, "presencaSebo") &&
    hasString(value.analiseDosOstiosFoliculares as Record<string, unknown>, "atrofiaOuCicatrizFolicular") &&
    hasObject(value, "conclusaoTricoscopica") &&
    hasString(value.conclusaoTricoscopica as Record<string, unknown>, "estadoGeral") &&
    hasArray(value.conclusaoTricoscopica as Record<string, unknown>, "principaisAchados") &&
    hasString(value.conclusaoTricoscopica as Record<string, unknown>, "indicadoresPositivos") &&
    hasString(value.conclusaoTricoscopica as Record<string, unknown>, "pontosDeAtencao") &&
    hasString(value.conclusaoTricoscopica as Record<string, unknown>, "correlacaoAnaliseVisual")
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
          `A resposta anterior veio inválida para o modo ${mode}. ` +
          `Retorne apenas o JSON corrigido, sem markdown, sem explicações e sem texto extra. ` +
          `Use exatamente a mesma estrutura solicitada. Resposta anterior:\n${previousResponse}`,
      },
    ],
  },
];