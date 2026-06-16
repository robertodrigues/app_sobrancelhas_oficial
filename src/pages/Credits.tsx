import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Loader2,
  Wallet,
  TrendingUp,
  ArrowLeft,
  QrCode,
  Copy,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { useUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { createUserStorageKey } from '@/lib/userStorage';

type CreditTransaction = {
  id: string;
  type: string;
  amount_cents: number;
  payment_id: string | null;
  status: string;
  created_at: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://app-sobrancelhas-oficial-5svn.onrender.com';
const MIN_AMOUNT = 5;
const MAX_AMOUNT = 100;
const QUICK_VALUES = [10, 20, 50, 100];

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Credits = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [amount, setAmount] = useState('');
  const [balanceCents, setBalanceCents] = useState(0);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [pixCopyCode, setPixCopyCode] = useState('');
  const [pendingRechargeAmount, setPendingRechargeAmount] = useState(0);
  const [confirming, setConfirming] = useState(false);

  const balance = balanceCents / 100;

  const loadWallet = async () => {
    if (!user?.id) return;

    setRefreshing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL.replace(/\/$/, '')}/api/credits/wallet?userId=${encodeURIComponent(user.id)}`,
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      const nextBalance = Number(data.balance_cents ?? data.balanceCents ?? 0);
      setBalanceCents(Number.isFinite(nextBalance) ? nextBalance : 0);
      setHistory(Array.isArray(data.recentTransactions) ? data.recentTransactions : []);
    } catch (error: any) {
      showError(error.message || 'Não foi possível carregar seus créditos.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setBalanceCents(0);
    setHistory([]);
    setAmount('');
    setPaymentDialogOpen(false);
    setPaymentId(null);
    setQrCodeBase64('');
    setPixCopyCode('');
    setPendingRechargeAmount(0);

    if (user?.id) {
      loadWallet();
    }
  }, [user?.id]);

  const recentTransactions = useMemo(() => history.slice(0, 8), [history]);

  const handleStartRecharge = async () => {
    if (!user?.id) {
      showError('Sessão inválida. Faça login novamente.');
      return;
    }

    const numericAmount = Number(amount.replace(',', '.'));

    if (!Number.isFinite(numericAmount)) {
      showError('Digite um valor válido.');
      return;
    }

    if (numericAmount < MIN_AMOUNT || numericAmount > MAX_AMOUNT) {
      showError(`A recarga deve ficar entre ${formatCurrency(MIN_AMOUNT)} e ${formatCurrency(MAX_AMOUNT)}.`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/credits/create-pix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          amount: numericAmount,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setPendingRechargeAmount(numericAmount);
      setPaymentId(data.paymentId);
      setQrCodeBase64(data.qrCodeBase64 || '');
      setPixCopyCode(data.qrCode || '');
      setPaymentDialogOpen(true);
    } catch (error: any) {
      showError(error.message || 'Não foi possível gerar o Pix.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!user?.id || !paymentId) {
      showError('Sessão inválida. Faça login novamente.');
      return;
    }

    setConfirming(true);
    try {
      const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/credits/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          paymentId,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();

      if (data?.success) {
        const newBalanceValue = Number(data.newBalance ?? 0);
        setBalanceCents(Number.isFinite(newBalanceValue) ? newBalanceValue : 0);
        setHistory((prev) => [
          {
            id: `recharge-${paymentId}`,
            type: 'recharge',
            amount_cents: pendingRechargeAmount * 100,
            payment_id: paymentId,
            status: 'approved',
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        showSuccess(`Pagamento confirmado! Seu saldo agora é ${formatCurrency((newBalanceValue || 0) / 100)}.`);
        setPaymentDialogOpen(false);
        setPaymentId(null);
        setQrCodeBase64('');
        setPixCopyCode('');
        setPendingRechargeAmount(0);
        await loadWallet();
        return;
      }

      showError('Pagamento ainda não identificado, aguarde alguns minutos e tente novamente');
    } catch (error: any) {
      showError(error.message || 'Pagamento ainda não identificado, aguarde alguns minutos e tente novamente');
    } finally {
      setConfirming(false);
    }
  };

  const copyPixCode = async () => {
    if (!pixCopyCode) return;

    await navigator.clipboard.writeText(pixCopyCode);
    showSuccess('Código Pix copiado.');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] pb-24 md:pt-20">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <header className="relative flex items-center justify-center mb-8 text-center pt-4">
          <button onClick={handleBack} className="absolute left-0 p-2 hover:bg-[#E8DECE] rounded-full transition-colors text-[#1C3A2B]">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-heading text-2xl font-normal text-[#1C3A2B]">Créditos</h1>
            <p className="font-label-category text-[10px] text-[#4A7A5C] mt-0.5">Recarga via Pix Mercado Pago</p>
          </div>
          <div className="absolute right-0 w-8 h-8 rounded-full bg-[#4A7A5C]/10 flex items-center justify-center text-[#4A7A5C]">
            <Wallet size={16} />
          </div>
        </header>

        <div className="bg-[#E8DECE] rounded-3xl shadow-sm border border-[#D4C9B5] p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-body text-xs text-[#4A7A5C]">Créditos Disponíveis</p>
              <h2 className="font-heading text-3xl font-medium text-[#1C3A2B] mt-1">
                {formatCurrency(balance)}
              </h2>
            </div>
            <div className="bg-[#F5F0E8] p-2.5 rounded-xl border border-[#D4C9B5]">
              {refreshing ? <Loader2 className="animate-spin text-[#4A7A5C]" size={20} /> : <TrendingUp className="text-[#4A7A5C]" size={20} />}
            </div>
          </div>

          <div className="rounded-2xl border border-[#D4C9B5] bg-[#F5F0E8] p-4 space-y-3">
            <div>
              <Label htmlFor="amount" className="font-label-category text-[10px] text-[#1C3A2B]">Quanto você quer recarregar?</Label>
              <Input
                id="amount"
                type="number"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step="1"
                placeholder="Ex: 10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 bg-white border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {QUICK_VALUES.map((value) => (
                <Button key={value} variant="outline" className="btn-elha-outline h-11" onClick={() => setAmount(String(value))}>
                  R$ {value}
                </Button>
              ))}
            </div>

            <p className="text-[11px] text-[#4A7A5C]">
              Mínimo {formatCurrency(MIN_AMOUNT)} e máximo {formatCurrency(MAX_AMOUNT)}.
            </p>

            <Button onClick={handleStartRecharge} disabled={loading || !amount.trim()} className="btn-elha-primary w-full gap-2 h-12">
              {loading ? <Loader2 className="animate-spin" /> : <>Gerar QR Code Pix</>}
            </Button>
          </div>

          <div className="pt-1 border-t border-[#D4C9B5]">
            <h3 className="font-label-category text-[10px] text-[#1C3A2B] mb-3">Histórico recente</h3>

            {recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {recentTransactions.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-[#D4C9B5] bg-[#F5F0E8] px-4 py-3">
                    <div>
                      <p className="font-heading text-sm font-medium text-[#1C3A2B]">
                        {item.type === 'debit' ? '-' : '+'} {formatCurrency(item.amount_cents / 100)}
                      </p>
                      <p className="font-body text-[10px] text-[#4A7A5C]">
                        {item.type === 'debit' ? 'Uso em análise' : 'Recarga Pix'} • {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-[10px] uppercase tracking-[1px] text-[#4A7A5C]">{item.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-[#F5F0E8] rounded-xl border border-dashed border-[#D4C9B5]">
                <div className="w-10 h-10 rounded-full bg-[#E8DECE] flex items-center justify-center mx-auto mb-3">
                  <CreditCard size={16} className="text-[#4A7A5C]" />
                </div>
                <p className="font-heading text-sm font-medium text-[#1C3A2B]">Nenhuma movimentação</p>
                <p className="font-body text-[10px] text-[#4A7A5C] mt-1">As recargas e usos de crédito aparecerão aqui.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1C3A2B]">Pague o Pix para liberar a recarga</DialogTitle>
            <DialogDescription className="text-[#4A7A5C]">
              Assim que o Mercado Pago confirmar o pagamento de {formatCurrency(pendingRechargeAmount)}, seus créditos serão adicionados automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#D4C9B5] bg-white p-4 flex items-center justify-center">
              {qrCodeBase64 ? (
                <img src={`data:image/png;base64,${qrCodeBase64}`} alt="QR Code Pix" className="w-56 h-56 object-contain" />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center text-[#4A7A5C]">
                  <Loader2 className="animate-spin" />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#D4C9B5] bg-white p-4">
              <div className="flex items-center gap-2 text-[#4A7A5C] mb-2">
                <QrCode size={16} />
                <span className="text-[10px] uppercase tracking-[1px] font-medium">Copia e cola</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="break-all text-xs text-[#1C3A2B] bg-[#F5F0E8] rounded-xl p-3 border border-[#D4C9B5] flex-1">
                  {pixCopyCode || 'Gerando código Pix...'}
                </p>
                <Button variant="outline" className="btn-elha-outline h-11 px-3" onClick={copyPixCode} disabled={!pixCopyCode}>
                  <Copy size={14} />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#4A7A5C]">
              {confirming ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {confirming ? 'Confirmando pagamento...' : 'Quando pagar, clique em “Já paguei”.'}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="btn-elha-outline gap-2" onClick={handleConfirmPayment} disabled={confirming || !paymentId}>
              <RefreshCw size={14} />
              Já paguei
            </Button>
            <Button variant="outline" className="btn-elha-outline gap-2" onClick={loadWallet}>
              <RefreshCw size={14} />
              Atualizar saldo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Credits;
