const R2_UPLOAD_ENDPOINT = "/api/uploads/r2";

export interface UploadR2Response {
  url: string;
  key: string;
}

export async function uploadPhotoToR2(file: File): Promise<UploadR2Response> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(R2_UPLOAD_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Erro ao enviar foto para o servidor.");
  }

  return response.json();
}