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
    <div className="min-h-screen bg-slate-50 pb-24 md:pt-20">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <Button asChild size="sm" className="gap-2">
            <Link to="/novo-cliente">
              <UserPlus size={18} />
              <span>Novo</span>
            </Link>
          </Button>
        </header>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Buscar cliente..." 
            className="pl-10 bg-white border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-accent" size={32} />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClients.length > 0 ? filteredClients.map((client) => (
              <Card key={client.id} className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{client.name}</h3>
                        <p className="text-xs text-slate-500">Cadastrado em: {new Date(client.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical size={18} />
                    </Button>
                  </div>
                  <div className="mt-4 flex gap-4">
                    {client.phone && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Phone size={12} />
                        {client.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Mail size={12} />
                      {client.email}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400">Nenhum cliente encontrado.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Clients;