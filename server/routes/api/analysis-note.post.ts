import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { createClient } from "@supabase/supabase-js";

type AnalysisNoteBody = {
  analysisId?: string;
  imageUrl?: string;
  note?: string;
};

type AnalysisRow = {
  id: string;
  result: Record<string, unknown> | null;
};

export default defineHandler(async (event) => {
  const body = await readBody<AnalysisNoteBody>(event);
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  const analysisId = typeof body?.analysisId === "string" ? body.analysisId.trim() : "";
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";

  if (!analysisId && !imageUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: "analysisId ou imageUrl é obrigatório.",
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Configuração do Supabase ausente no servidor.",
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let analysis: AnalysisRow | null = null;

  if (analysisId) {
    const { data, error } = await supabase
      .from("analyses")
      .select("id, result")
      .eq("id", analysisId)
      .maybeSingle();

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }

    analysis = data as AnalysisRow | null;
  } else {
    const shouldAvoidImageLookup = imageUrl.startsWith("data:");

    if (!shouldAvoidImageLookup) {
      const { data, error } = await supabase
        .from("analyses")
        .select("id, result")
        .eq("image_url", imageUrl)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: error.message,
        });
      }

      analysis = data as AnalysisRow | null;
    }

    if (!analysis?.id) {
      const { data, error } = await supabase
        .from("analyses")
        .select("id, result")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: error.message,
        });
      }

      analysis = data as AnalysisRow | null;
    }
  }

  if (!analysis?.id) {
    throw createError({
      statusCode: 404,
      statusMessage: "Análise não encontrada.",
    });
  }

  const baseResult =
    analysis.result && typeof analysis.result === "object" && !Array.isArray(analysis.result)
      ? analysis.result
      : {};

  const nextResult = {
    ...baseResult,
    note,
  };

  const { error: updateError } = await supabase
    .from("analyses")
    .update({ result: nextResult })
    .eq("id", analysis.id);

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: updateError.message,
    });
  }

  return {
    ok: true,
    analysisId: analysis.id,
    result: nextResult,
  };
});