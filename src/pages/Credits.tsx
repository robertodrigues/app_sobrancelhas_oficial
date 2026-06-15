import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, CreditCard, Wallet, TrendingUp, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { useUser } from '@/lib/auth';
import { createUserStorageKey } from '@/lib/userStorage';

type PurchaseRecord = {
  amount: number;
  createdAt: string;
};

const DEFAULT_CREDITS = 0;

const Credits = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [currentCredits, setCurrentCredits] = useState(DEFAULT_CREDITS);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setCurrentCredits(DEFAULT_CREDITS);
      setPurchaseHistory([]);
      return;
    }

    const balanceKey = createUserStorageKey(user.id, 'credits-balance');
    const historyKey = createUserStorageKey(user.id, 'credits-history');

    const savedBalance = localStorage.getItem(balanceKey);
    const savedHistory = localStorage.getItem(historyKey);

    setCurrentCredits(savedBalance ? Number(savedBalance) || DEFAULT_CREDITS : DEFAULT_CREDITS);
    setPurchaseHistory(savedHistory ? JSON.parse(savedHistory) : []);
  }, [user?.id]);

  const persistCredits = (balance: number, history: PurchaseRecord[]) => {
    if (!user?.id) return;

    localStorage.setItem(createUserStorageKey(user.id, 'credits-balance'), String(balance));
    localStorage.setItem(createUserStorageKey(user.id, 'credits-history'), JSON.stringify(history));
  };

  const handleBuyCredits = async () => {
    if (!user?.id) {
      showError('Sessão inválida. Faça login novamente.');
      return;
    }

    if (!creditAmount.trim() || parseInt(creditAmount) <= 0) {
      showError('Por favor, insira um valor válido.');
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const amount = parseInt(creditAmount);
    const nextBalance = currentCredits + amount;
    const nextHistory = [
      { amount, createdAt: new Date().toISOString() },
      ...purchaseHistory,
    ];

    setCurrentCredits(nextBalance);
    setPurchaseHistory(nextHistory);
    persistCredits(nextBalance, nextHistory);
    setCreditAmount('');
    setLoading(false);
    showSuccess(`Compra de ${creditAmount} créditos realizada com sucesso!`);
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
            <p className="font-label-category text-[10px] text-[#4A7A5C] mt-0.5">Gerenciamento de Saldo</p>
          </div>
          <div className="absolute right-0 w-8 h-8 rounded-full bg-[#4A7A5C]/10 flex items-center justify-center text-[#4A7A5C]">
            <Wallet size={16} />
          </div>
        </header>

        <div className="bg-[#E8DECE] rounded-3xl shadow-sm border border-[#D4C9B5] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-body text-xs text-[#4A7A5C]">Créditos Disponíveis</p>
              <h2 className="font-heading text-3xl font-medium text-[#1C3A2B] mt-1">
                {currentCredits.toLocaleString()}{' '}
                <span className="font-body text-xs font-light text-[#4A7A5C]">créditos</span>
              </h2>
            </div>
            <div className="bg-[#F5F0E8] p-2.5 rounded-xl border border-[#D4C9B5]">
              <TrendingUp className="text-[#4A7A5C]" size={20} />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="amount" className="font-label-category text-[10px] text-[#1C3A2B]">Comprar Créditos</Label>
              <div className="flex gap-2 items-center mt-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="Quantidade"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  min="10"
                  step="10"
                  className="flex-1 bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
                />
                <Button
                  variant="outline"
                  className="btn-elha-outline px-4 h-11"
                  onClick={() => setCreditAmount('10')}
                >
                  10
                </Button>
                <Button
                  variant="outline"
                  className="btn-elha-outline px-4 h-11"
                  onClick={() => setCreditAmount('50')}
                >
                  50
                </Button>
                <Button
                  variant="outline"
                  className="btn-elha-outline px-4 h-11"
                  onClick={() => setCreditAmount('100')}
                >
                  100
                </Button>
              </div>
            </div>

            <Button
              onClick={handleBuyCredits}
              disabled={loading || !creditAmount.trim()}
              className="btn-elha-primary w-full gap-2 h-12"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Plus size={14} />
                  Comprar Créditos
                </>
              )}
            </Button>

            <div className="pt-4 border-t border-[#D4C9B5]">
              <h3 className="font-label-category text-[10px] text-[#1C3A2B] mb-3">Histórico de Compras</h3>

              {purchaseHistory.length > 0 ? (
                <div className="space-y-2">
                  {purchaseHistory.map((purchase, index) => (
                    <div key={`${purchase.createdAt}-${index}`} className="flex items-center justify-between rounded-xl border border-[#D4C9B5] bg-[#F5F0E8] px-4 py-3">
                      <div>
                        <p className="font-heading text-sm font-medium text-[#1C3A2B]">
                          +{purchase.amount} créditos
                        </p>
                        <p className="font-body text-[10px] text-[#4A7A5C]">
                          {new Date(purchase.createdAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(purchase.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-[#F5F0E8] rounded-xl border border-dashed border-[#D4C9B5]">
                  <div className="w-10 h-10 rounded-full bg-[#E8DECE] flex items-center justify-center mx-auto mb-3">
                    <CreditCard size={16} className="text-[#4A7A5C]" />
                  </div>
                  <p className="font-heading text-sm font-medium text-[#1C3A2B]">Nenhuma compra registrada</p>
                  <p className="font-body text-[10px] text-[#4A7A5C] mt-1">
                    Suas compras de créditos vão aparecer aqui.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Credits;