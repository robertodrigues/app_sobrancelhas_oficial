import { defineHandler, useRuntimeConfig } from "nitro";
import { createError, readBody } from "nitro/h3";
import {
  buildRepairMessages,
  parseAnthropicResult,
  validateAnthropicAnalysisResult,
  type AnalysisMode,
} from "../../utils/anthropic";

type AnthropicRequestBody = {
  messages?: Array<{ role: string; content: unknown }>;
  max_tokens?: number;
  temperature?: number;
  analysisMode?: AnalysisMode;
};

const REMOTE_BACKEND_URL = "https://app-sobrancelhas-oficial-5svn.onrender.com/api/anthropic";
const DEFAULT_MODEL = "claude-sonnet-4-6";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getCandidateText = (raw: unknown) => {
  if (isObject(raw) && isObject(raw.result)) {
    return JSON.stringify(raw.result);
  }

  if (isObject(raw) && Array.isArray(raw.content) && raw.content[0] && isObject(raw.content[0])) {
    const firstItem = raw.content[0] as Record<string, unknown>;
    if (typeof firstItem.text === "string") {
      return firstItem.text;
    }
  }

  if (isObject(raw) && typeof raw.text === "string") {
    return raw.text;
  }

  if (typeof raw === "string") {
    return raw;
  }

  return JSON.stringify(raw);
};

const requestUpstream = async (
  body: AnthropicRequestBody,
  runtimeConfig: ReturnType<typeof useRuntimeConfig>,
) => {
  const apiKey = runtimeConfig.NITRO_ANTHROPIC_API_KEY as string | undefined;

  if (apiKey) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: body.messages,
        max_tokens: body.max_tokens ?? 2000,
        temperature: body.temperature ?? 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw createError({
        statusCode: response.status,
        statusMessage: errorText || "Falha ao consultar a Anthropic.",
      });
    }

    return response.json();
  }

  const response = await fetch(REMOTE_BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: body.messages,
      max_tokens: body.max_tokens ?? 2000,
      temperature: body.temperature ?? 0,
      analysisMode: body.analysisMode,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw createError({
      statusCode: response.status,
      statusMessage: errorText || "Falha ao consultar o backend de IA.",
    });
  }

  return response.json();
};

export default defineHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const body = await readBody<AnthropicRequestBody>(event);

  if (!Array.isArray(body?.messages) || body.messages.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "messages é obrigatório.",
    });
  }

  const analysisMode: AnalysisMode =
    body.analysisMode === "tricoscopia"
      ? "tricoscopia"
      : body.analysisMode === "comparison"
        ? "comparison"
        : "single";

  let lastResponseText = "Sem resposta anterior.";
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const outgoingMessages =
      attempt === 0
        ? body.messages
        : buildRepairMessages(body.messages, analysisMode, lastResponseText);

    try {
      const rawResponse = await requestUpstream(
        {
          messages: outgoingMessages,
          max_tokens: body.max_tokens,
          temperature: body.temperature,
          analysisMode,
        },
        runtimeConfig,
      );

      const candidateText = getCandidateText(rawResponse);
      lastResponseText = candidateText;

      const parsedResult = parseAnthropicResult(candidateText);

      if (!validateAnthropicAnalysisResult(parsedResult, analysisMode)) {
        throw new Error("A resposta da IA não corresponde ao formato esperado.");
      }

      return {
        result: parsedResult,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw createError({
    statusCode: 502,
    statusMessage:
      lastError instanceof Error
        ? lastError.message
        : "Não foi possível obter uma resposta válida da IA.",
  });
});