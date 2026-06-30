import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, MoreVertical, Phone, Mail, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { useUser } from '@/lib/auth';
import { useSupabaseClient } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type ClientRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  user_id?: string;
};

const Clients = () => {
  const { user } = useUser();
  const supabase = useSupabaseClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientRecord | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchClients();
  }, [user?.id, supabase]);

  const fetchClients = async () => {
    setLoading(true);
    setClients([]);

    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        throw error;
      }

      setClients((data || []) as ClientRecord[]);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      showError('Erro ao buscar clientes.');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenEdit = (client: ClientRecord) => {
    setEditingClient(client);
    setEditForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
    });
    setEditOpen(true);
  };

  const handleUpdateClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingClient) return;

    if (!user?.id) {
      showError('Sessão inválida. Faça login novamente.');
      return;
    }

    if (!editForm.name.trim()) {
      showError('O nome é obrigatório.');
      return;
    }

    setEditLoading(true);

    try {
      const updateData = {
        name: editForm.name.trim(),
        email: editForm.email.trim() || null,
        phone: editForm.phone.trim() || null,
        user_id: user.id,
      };

      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', editingClient.id)
        .eq('user_id', user.id);

      if (error) throw error;

      showSuccess('Cliente atualizado com sucesso!');
      setEditOpen(false);
      setEditingClient(null);
      await fetchClients();
    } catch (err) {
      console.error(err);
      showError('Não foi possível atualizar o cliente.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenDelete = (client: ClientRecord) => {
    setDeletingClient(client);
    setDeleteOpen(true);
  };

  const handleDeleteClient = async () => {
    if (!deletingClient) return;

    if (!user?.id) {
      showError('Sessão inválida. Faça login novamente.');
      return;
    }

    setDeleteLoading(true);

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', deletingClient.id)
        .eq('user_id', user.id);

      if (error) throw error;

      showSuccess('Cliente excluído com sucesso!');
      setDeleteOpen(false);
      setDeletingClient(null);
      await fetchClients();
    } catch (err) {
      console.error(err);
      showError('Não foi possível excluir o cliente.');
    } finally {
      setDeleteLoading(false);
    }
  };

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
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#1C3A2B]/10 text-[#1C3A2B] flex items-center justify-center font-heading font-medium text-base shrink-0">
                        {client.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading text-base font-medium text-[#1C3A2B] truncate">{client.name}</h3>
                        <p className="font-body text-[10px] text-[#4A7A5C]">
                          Cadastrado em: {new Date(client.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1C3A2B] hover:bg-[#1C3A2B]/5">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-[#F5F0E8] border-[#D4C9B5]">
                        <DropdownMenuItem
                          className="cursor-pointer flex items-center gap-2 text-[#1C3A2B]"
                          onClick={() => handleOpenEdit(client)}
                        >
                          <Pencil size={14} />
                          Editar cliente
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer flex items-center gap-2 text-red-600 focus:text-red-600"
                          onClick={() => handleOpenDelete(client)}
                        >
                          <Trash2 size={14} />
                          Excluir cliente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    {client.phone && (
                      <div className="flex items-center gap-1 font-body text-xs text-[#1C3A2B]/80">
                        <Phone size={12} className="text-[#4A7A5C]" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-1 font-body text-xs text-[#1C3A2B]/80 break-all">
                        <Mail size={12} className="text-[#4A7A5C]" />
                        <span>{client.email}</span>
                      </div>
                    )}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Editar cliente</DialogTitle>
            <DialogDescription className="text-[#4A7A5C]">
              Atualize os dados do cliente selecionado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateClient} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="font-label-category text-[10px] text-[#1C3A2B]">
                Nome
              </Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-[#E8DECE] border-[#D4C9B5] text-[#1C3A2B] h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email" className="font-label-category text-[10px] text-[#1C3A2B]">
                E-mail
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                className="bg-[#E8DECE] border-[#D4C9B5] text-[#1C3A2B] h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="font-label-category text-[10px] text-[#1C3A2B]">
                Telefone
              </Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="bg-[#E8DECE] border-[#D4C9B5] text-[#1C3A2B] h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="btn-elha-outline h-11"
                disabled={editLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="btn-elha-primary h-11" disabled={editLoading}>
                {editLoading ? <Loader2 className="animate-spin" size={14} /> : 'Salvar alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl">Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#4A7A5C]">
              Essa ação não pode ser desfeita. O cliente será removido definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-elha-outline h-11" disabled={deleteLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteClient();
              }}
              className="bg-red-600 text-white hover:bg-red-700 h-11"
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="animate-spin" size={14} /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;