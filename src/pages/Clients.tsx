import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, MoreVertical, Phone, Mail, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] pb-24 md:pt-20">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <header className="relative flex flex-col items-center justify-center mb-6 text-center pt-4">
          <h1 className="font-heading text-2xl font-normal text-[#1C3A2B]">Clientes</h1>
          <p className="font-body text-xs text-[#4A7A5C] font-light mt-1">Gerencie sua lista de clientes cadastrados</p>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <Button asChild size="sm" className="btn-elha-primary gap-1.5 h-9 px-4">
              <Link to="/novo-cliente">
                <UserPlus size={14} />
                <span>Novo</span>
              </Link>
            </Button>
          </div>
        </header>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A7A5C]" size={18} />
          <Input 
            placeholder="Buscar cliente..." 
            className="pl-10 bg-[#E8DECE] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[#4A7A5C]" size={32} />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClients.length > 0 ? filteredClients.map((client) => (
              <Card key={client.id} className="border border-[#D4C9B5] bg-[#E8DECE] rounded-2xl shadow-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1C3A2B]/10 text-[#1C3A2B] flex items-center justify-center font-heading font-medium text-base">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-heading text-base font-medium text-[#1C3A2B]">{client.name}</h3>
                        <p className="font-body text-[10px] text-[#4A7A5C]">Cadastrado em: {new Date(client.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1C3A2B] hover:bg-[#1C3A2B]/5">
                      <MoreVertical size={16} />
                    </Button>
                  </div>
                  <div className="mt-4 flex gap-4">
                    {client.phone && (
                      <div className="flex items-center gap-1 font-body text-xs text-[#1C3A2B]/80">
                        <Phone size={12} className="text-[#4A7A5C]" />
                        {client.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-1 font-body text-xs text-[#1C3A2B]/80">
                      <Mail size={12} className="text-[#4A7A5C]" />
                      {client.email}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-12 bg-[#E8DECE] rounded-2xl border border-dashed border-[#D4C9B5]">
                <p className="font-body text-[#4A7A5C] text-sm">Nenhum cliente encontrado.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Clients;