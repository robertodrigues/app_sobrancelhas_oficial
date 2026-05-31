import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, CreditCard, Wallet, TrendingUp, Loader2, ArrowLeft } from 'lucide-react';
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
              <div className="space-y-3">
                {[10, 50, 100].map(amount => (
                  <div key={amount} className="flex items-center justify-between p-3 bg-[#F5F0E8] rounded-xl border border-[#D4C9B5]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E8DECE] flex items-center justify-center">
                        <CreditCard size={14} className="text-[#4A7A5C]" />
                      </div>
                      <div>
                        <p className="font-heading text-sm font-medium text-[#1C3A2B]">Compra de {amount} créditos</p>
                        <p className="font-body text-[10px] text-[#4A7A5C]">Há 2 dias • Cartão Visa</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-sm font-medium text-[#1C3A2B]">- {amount} cr</p>
                      <p className="font-body text-[10px] text-[#4A7A5C]">R$ {(amount * 0.5).toFixed(2)}</p>
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