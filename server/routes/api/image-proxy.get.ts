import { defineHandler } from "nitro";
import { createError, getQuery } from "nitro/h3";

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const url = typeof query.url === "string" ? query.url : "";

  if (!url) {
    throw createError({ statusCode: 400, statusMessage: "url é obrigatória." });
  }

  if (!isValidHttpUrl(url)) {
    throw createError({ statusCode: 400, statusMessage: "url inválida." });
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: "Não foi possível carregar a imagem.",
    });
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = await response.arrayBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});