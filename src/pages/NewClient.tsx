import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { useSupabaseClient } from '@/lib/supabase';
import { useUser } from '@/lib/auth';

const NewClient = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      showError('Sessão inválida. Faça login novamente.');
      return;
    }

    if (!formData.name.trim()) {
      showError('O nome é obrigatório');
      return;
    }

    setLoading(true);
    
    try {
      const dataToSave = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        user_id: user.id,
      };

      const { error } = await supabase
        .from('clients')
        .insert([dataToSave]);

      if (error) {
        throw error;
      }

      showSuccess('Cliente cadastrado com sucesso!');
      navigate('/clientes');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      const errorMsg = error.message || 'Erro desconhecido';
      showError(`Erro ao cadastrar: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] pb-24 md:pt-20">
      <Navbar />
      <main className="max-w-md mx-auto p-6">
        <header className="relative flex items-center justify-center mb-8 text-center pt-4">
          <button onClick={() => navigate(-1)} className="absolute left-0 p-2 hover:bg-[#E8DECE] rounded-full transition-colors text-[#1C3A2B]">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-heading text-2xl font-normal text-[#1C3A2B]">Novo Cliente</h1>
            <p className="font-label-category text-[10px] text-[#4A7A5C] mt-0.5">Cadastro Técnico</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 bg-[#E8DECE] p-6 rounded-2xl shadow-sm border border-[#D4C9B5]">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-label-category text-[10px] text-[#1C3A2B]">Nome Completo *</Label>
            <Input 
              id="name" 
              placeholder="Ex: Maria Silva" 
              required 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              disabled={loading}
              className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="font-label-category text-[10px] text-[#1C3A2B]">E-mail (Opcional)</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="maria@exemplo.com" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              disabled={loading}
              className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="font-label-category text-[10px] text-[#1C3A2B]">Telefone (Opcional)</Label>
            <Input 
              id="phone" 
              placeholder="(11) 99999-9999" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              disabled={loading}
              className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
            />
          </div>

          <Button type="submit" className="btn-elha-primary w-full gap-2 h-12" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={14} /> Salvar Cliente</>}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default NewClient;