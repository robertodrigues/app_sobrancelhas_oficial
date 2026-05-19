import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/lib/supabase';

const NewClient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError('O nome é obrigatório');
      return;
    }

    setLoading(true);
    
    try {
      const dataToSave = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null
      };

      const { error, data } = await supabase
        .from('clients')
        .insert([dataToSave])
        .select();

      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw error;
      }

      showSuccess('Cliente cadastrado com sucesso!');
      navigate('/clientes');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      // Exibe a mensagem de erro real vinda do banco de dados
      const errorMsg = error.message || 'Erro desconhecido';
      showError(`Erro ao cadastrar: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pt-20">
      <Navbar />
      <main className="max-w-md mx-auto p-6">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Novo Cliente</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input 
              id="name" 
              placeholder="Ex: Maria Silva" 
              required 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">E-mail (Opcional)</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="maria@exemplo.com" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (Opcional)</Label>
            <Input 
              id="phone" 
              placeholder="(11) 99999-9999" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full gap-2 h-12 text-lg bg-accent hover:bg-accent/90" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Salvar Cliente</>}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default NewClient;