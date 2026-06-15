import { toast } from "sonner";

const translateErrorMessage = (message: string) => {
  const normalized = message.trim();

  if (!normalized) {
    return "Ocorreu um erro inesperado.";
  }

  const translations: Array<{ pattern: RegExp; text: string }> = [
    {
      pattern: /email_address_id` is required when `strategy` is `email_code`/i,
      text: "`email_address_id` é obrigatório quando a estratégia é `email_code`.",
    },
    {
      pattern: /password is incorrect/i,
      text: "Senha incorreta.",
    },
    {
      pattern: /incorrect password/i,
      text: "Senha incorreta.",
    },
    {
      pattern: /invalid password/i,
      text: "Senha inválida.",
    },
    {
      pattern: /invalid email and\/or password/i,
      text: "E-mail e/ou senha inválidos.",
    },
    {
      pattern: /email code/i,
      text: "Código de e-mail inválido ou expirado.",
    },
    {
      pattern: /verification code/i,
      text: "Código de verificação inválido ou expirado.",
    },
    {
      pattern: /too many requests/i,
      text: "Muitas tentativas. Tente novamente em instantes.",
    },
    {
      pattern: /network error/i,
      text: "Erro de conexão. Verifique sua internet e tente novamente.",
    },
    {
      pattern: /user not found/i,
      text: "E-mail não encontrado.",
    },
    {
      pattern: /authentication failed/i,
      text: "Falha na autenticação.",
    },
    {
      pattern: /missing.*email/i,
      text: "E-mail ausente.",
    },
    {
      pattern: /failed to fetch/i,
      text: "Não foi possível conectar ao servidor.",
    },
    {
      pattern: /request failed/i,
      text: "Não foi possível concluir a solicitação.",
    },
  ];

  for (const item of translations) {
    if (item.pattern.test(normalized)) {
      return item.text;
    }
  }

  return normalized;
};

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(translateErrorMessage(message));
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};