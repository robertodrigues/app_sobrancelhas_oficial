import OpenAI from "openai";
import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { useRuntimeConfig } from "nitro";
import { buildRepairMessages, parseAnalysisResult, validateAnalysisResult } from "../../utils/openai";
import type { AnalysisMode } from "../../src/services/types";

type AnalysisMessage = {
  role: string;
  content: unknown;
};

type AnalysisRequestBody = {
  messages?: AnalysisMessage[];
  max_tokens?: number;
  temperature?: number;
  analysisMode?: AnalysisMode;
};

const REMOTE_BACKEND_URL = "https://app-sobrancelhas-oficial-5svn.onrender.com/api/anthropic";
const DEFAULT_MODEL = "gpt-4o";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeRole = (role: string): "system" | "user" | "assistant" | "developer" =>
  role === "system" || role === "assistant" || role === "developer" ? role : "user";

const toOpenAIContent = (content: unknown) => {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const parts = content.flatMap((item) => {
      if (!isObject(item)) return [];

      if (item.type === "text" && typeof item.text === "string") {
        return [{ type: "text" as const, text: item.text }];
      }

      if (
        item.type === "image" &&
        isObject(item.source) &&
        item.source.type === "base64" &&
        typeof item.source.data === "string" &&
        typeof item.source.media_type === "string"
      ) {
        return [
          {
            type: "image_url" as const,
            image_url: {
              url: `data:${item.source.media_type};base64,${item.source.data}`,
            },
          },
        ];
      }

      return [];
    });

    return parts.length > 0 ? parts : "";
  }

  if (content === null || content === undefined) {
    return "";
  }

  return String(content);
};

const convertMessagesForOpenAI = (messages: AnalysisMessage[]) =>
  messages.map((message) => ({
    role: normalizeRole(message.role),
    content: toOpenAIContent(message.content),
  }));

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
  body: AnalysisRequestBody,
  messages: AnalysisMessage[],
) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  console.log("=== VERIFICANDO PROVEDOR DE IA ===");
  console.log("OPENAI_API_KEY existe?", !!process.env.OPENAI_API_KEY);
  console.log("Modelo configurado:", model);

  if (apiKey) {
    const client = new OpenAI({ apiKey });
    console.log(">>> CHAMANDO OPENAI AGORA <<<");

    const response = await client.chat.completions.create({
      model,
      messages: convertMessagesForOpenAI(messages),
      max_completion_tokens: 8000,
      temperature: body.temperature ?? 0,
      response_format: { type: "json_object" },
    });

    const text = response.choices[0]?.message?.content?.trim();

    if (!text) {
      throw createError({
        statusCode: 502,
        statusMessage: "A OpenAI não retornou um texto válido.",
      });
    }

    return {
      content: [{ type: "text", text }],
    };
  }

  console.log(">>> CAINDO NO FALLBACK - CHAMANDO CLAUDE <<<");
  const response = await fetch(REMOTE_BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
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
  const body = await readBody<AnalysisRequestBody>(event);

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
        outgoingMessages,
      );

      const candidateText = getCandidateText(rawResponse);
      lastResponseText = candidateText;

      const parsedResult = parseAnalysisResult(candidateText);

      if (!validateAnalysisResult(parsedResult, analysisMode)) {
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