import { defineHandler } from "nitro";
import { readBody, createError } from "nitro/h3";
import { useRuntimeConfig } from "nitro";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export default defineHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiKey = config.RESEND_API_KEY;
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: "RESEND_API_KEY not configured" });
  }

  const body = await readBody<EmailPayload>(event);
  if (!body?.to || !body?.subject || !body?.html) {
    throw createError({ statusCode: 400, statusMessage: "Missing email fields" });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "no-reply@yourdomain.com",
      to: body.to,
      subject: body.subject,
      html: body.html,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw createError({ statusCode: response.status, statusMessage: err });
  }

  const data = await response.json();
  return { ok: true, data };
});
