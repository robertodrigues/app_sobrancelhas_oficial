import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, CreditCard, Wallet, TrendingUp, Loader2, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

const Credits = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [currentCredits, setCurrentCredits] = useState(0);

  useEffect(() => {
    setCurrentCredits(150);
  }, []);

  const handleBuyCredits = async () => {
    if (!creditAmount.trim() || parseInt(creditAmount) <= 0) {
      showError('Por favor, insira um valor válido.');
      return;
    }

    setLoading(true);
    try {
      // Simulação de compra - em produção, integrar com Stripe, PayPal, etc.
      // Exemplo: await stripe.charge(amount);

      // Placeholder: Substitua por lógica real de pagamento
      setTimeout(() => {
        showSuccess(`Compra de ${creditAmount} créditos realizada com sucesso!`);
        setCurrentCredits(prev => prev + parseInt(creditAmount));
        setCreditAmount('');
        setLoading(false);
      }, 2000);
    } catch (error) {
      showError('Erro ao processar pagamento. Tente novamente.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pt-20">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <header className="flex items-center justify-between mb-8">
          <button onClick={handleBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Gerenciamento de Créditos</h1>
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <Wallet size={20} />
          </div>
        </header>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-slate-500">Créditos Disponíveis</p>
              <h2 className="text-3xl font-bold text-slate-900">{currentCredits.toLocaleString()} <span className="text-base font-normal text-slate-500">créditos</span></h2>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <TrendingUp className="text-accent" size={24} />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="amount">Comprar Créditos</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="Quantidade" 
                  value={creditAmount} 
                  onChange={(e) => setCreditAmount(e.target.value)}
                  min="10"
                  step="10"
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  className="px-4 h-12 rounded-xl border-slate-300"
                  onClick={() => setCreditAmount('10')}
                >
                  10
                </Button>
                <Button 
                  variant="outline" 
                  className="px-4 h-12 rounded-xl border-slate-300"
                  onClick={() => setCreditAmount('50')}
                >
                  50
                </Button>
                <Button 
                  variant="outline" 
                  className="px-4 h-12 rounded-xl border-slate-300"
                  onClick={() => setCreditAmount('100')}
                >
                  100
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleBuyCredits}
              disabled={loading || !creditAmount.trim()}
              className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Plus size={20} />
                  Comprar Créditos
                </>
              )}
            </Button>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Histórico de Compras</h3>
              <div className="space-y-3">
                {[10, 50, 100].map(amount => (
                  <div key={amount} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                        <CreditCard size={16} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Compra de {amount} créditos</p>
                        <p className="text-xs text-slate-500">Há 2 dias • Cartão Visa</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">- {amount} créditos</p>
                      <p className="text-xs text-slate-500">R$ {(amount * 0.5).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Credits;