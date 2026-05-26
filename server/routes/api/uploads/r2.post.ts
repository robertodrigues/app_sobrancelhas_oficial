import { defineHandler, useRuntimeConfig } from "nitro";
import { readMultipartFormData, createError } from "nitro/h3";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const imageContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export default defineHandler(async (event) => {
  const formData = await readMultipartFormData(event);

  if (!formData?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Nenhum arquivo foi enviado.",
    });
  }

  const file = formData.find((item) => item.name === "file" && item.data);

  if (!file?.data) {
    throw createError({
      statusCode: 400,
      statusMessage: "O campo 'file' é obrigatório.",
    });
  }

  if (!file.type || !imageContentTypes.has(file.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Tipo de arquivo inválido: ${file.type || "desconhecido"}.`,
    });
  }

  const config = useRuntimeConfig();
  const accessKeyId = config.R2_ACCESS_KEY_ID;
  const secretAccessKey = config.R2_SECRET_ACCESS_KEY;
  const endpoint = config.R2_ENDPOINT;
  const bucketName = config.R2_BUCKET_NAME;
  const publicUrl = config.R2_PUBLIC_URL;

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName || !publicUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "As variáveis do R2 não estão configuradas.",
    });
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";

  const key = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.data,
      ContentType: file.type,
    }),
  );

  return {
    key,
    url: `${publicUrl.replace(/\/$/, "")}/${key}`,
  };
});