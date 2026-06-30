const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.elha.com.br";

const R2_UPLOAD_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/api/document-upload`;

export interface UploadR2Response {
  url: string;
  key: string;
}

export interface UploadR2Options {
  userId: string;
  folder?: string;
}

export async function uploadPhotoToR2(file: File, options: UploadR2Options): Promise<UploadR2Response> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("userId", options.userId);
  formData.append("folder", options.folder || "capturas");

  const response = await fetch(R2_UPLOAD_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Upload failed (${response.status}): ${errorText || "Erro ao enviar foto para o servidor."}`,
    );
  }

  return response.json();
}