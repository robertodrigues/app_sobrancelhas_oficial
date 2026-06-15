const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://app-sobrancelhas-oficial-5svn.onrender.com';

const normalizeAmount = (amount: number) => Math.round(amount * 100);

export type CreditTransaction = {
  id: string;
  type: 'topup' | 'debit';
  amount_cents: number;
  payment_id: string | null;
  status: string;
  created_at: string;
};

export type CreditWalletResponse = {
  balanceCents: number;
  recentTransactions: CreditTransaction[];
};

export type CreatePixResponse = {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string | null;
  status: string;
};

const requestJson = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Não foi possível concluir a solicitação.');
  }

  return response.json();
};

export const getCreditWallet = (userId: string) =>
  requestJson<CreditWalletResponse>(`/api/credits/wallet?userId=${encodeURIComponent(userId)}`);

export const createPixRecharge = (payload: {
  userId: string;
  email: string;
  amountReais: number;
}) =>
  requestJson<CreatePixResponse>('/api/credits/create-pix', {
    method: 'POST',
    body: JSON.stringify({
      userId: payload.userId,
      email: payload.email,
      amountCents: normalizeAmount(payload.amountReais),
    }),
  });

export const checkPixRechargeStatus = (paymentId: string) =>
  requestJson<CreditWalletResponse & { paymentStatus: string }>(
    `/api/credits/payment-status?paymentId=${encodeURIComponent(paymentId)}`,
  );

export const consumeAnalysisCredit = (userId: string) =>
  requestJson<CreditWalletResponse>('/api/credits/consume', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      amountCents: 190,
    }),
  });
