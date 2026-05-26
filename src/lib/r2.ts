const R2_UPLOAD_ENDPOINT = "/api/uploads/r2";

export interface UploadR2Response {
  url: string;
  key: string;
}

export async function uploadPhotoToR2(file: File): Promise<UploadR2Response> {
  const formData = new FormData();
  formData.append("file", file, file.name);

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