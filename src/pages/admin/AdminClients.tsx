import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Plus, Loader2, Pencil, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email?: string | null; // Добавляем email
  role: 'admin' | 'client' | 'mechanic';
  created_at: string | null;
  updated_at: string | null;
  vehicles: {
    id: string;
    make: string;
    model: string;
    year: number;
    vin: string | null;
    created_at: string | null;
    updated_at: string | null;
  }[];
}

const AdminClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  });
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', email: '', role: 'client' });
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    if (editingClient) {
      setEditForm({
        first_name: editingClient.first_name || '',
        last_name: editingClient.last_name || '',
        phone: editingClient.phone || '',
        email: editingClient.email || '',
        role: editingClient.role || 'client',
      });
    }
  }, [editingClient]);

  const handleEditClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone: editForm.phone,
          email: editForm.email,
          role: editForm.role,
        })
        .eq('id', editingClient.id);
      if (error) throw error;
      setIsEditDialogOpen(false);
      setEditingClient(null);
      fetchClients();
    } catch (err) {
      console.error('Ошибка при редактировании клиента:', err);
    }
  };
// Удалено дублирующееся определение handleEditClient ниже

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error('Не удалось определить отправителя');
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: userData.user.id,
          receiver_id: editingClient.id,
          content: messageText,
        });
      if (error) throw error;
      setMessageDialogOpen(false);
      setEditingClient(null);
      setMessageText('');
    } catch (err) {
      console.error('Ошибка при отправке сообщения:', err);
    }
  };


  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          email,
          role,
          created_at,
          updated_at,
          vehicles (
            id,
            make,
            model,
            year,
            vin,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched clients:', data);
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Ошибка при загрузке клиентов');
      toast.error('Ошибка при загрузке клиентов');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    try {
      if (!newClient.email || !newClient.first_name || !newClient.last_name) {
        toast.error('Пожалуйста, заполните все обязательные поля');
        return;
      }

      // Создаем пользователя в auth.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newClient.email,
        password: Math.random().toString(36).slice(-8), // Генерируем случайный пароль
      });

      if (authError) throw authError;
      if (!authData.user?.id) throw new Error('Failed to create user');

      // Создаем профиль клиента
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: newClient.first_name,
          last_name: newClient.last_name,
          phone: newClient.phone,
          email: newClient.email,
          role: 'client',
        });

      if (profileError) throw profileError;

      // Очищаем форму и обновляем список
      setNewClient({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
      });
      toast.success('Клиент успешно добавлен');
      fetchClients();
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Ошибка при добавлении клиента');
    }
  };



  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого клиента?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast.success('Клиент успешно удален');
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Ошибка при удалении клиента');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchClients}>Повторить попытку</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Управление клиентами</h1>
        <p className="text-muted-foreground">
          Добавление и управление клиентами автосервиса
        </p>
      </div>

      <div className="mb-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Добавить клиента
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить нового клиента</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Заполните данные нового клиента
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Имя *</Label>
                <Input
                  id="first_name"
                  value={newClient.first_name}
                  onChange={(e) => setNewClient({ ...newClient, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Фамилия *</Label>
                <Input
                  id="last_name"
                  value={newClient.last_name}
                  onChange={(e) => setNewClient({ ...newClient, last_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  required
                />
              </div>
              <Button onClick={handleAddClient} className="w-full">
                Добавить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {clients.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-[200px]">
              <p className="text-muted-foreground">Клиенты не найдены</p>
            </CardContent>
          </Card>
        ) : (
          clients.map((client) => (
            <Card key={client.id} className="transition-transform hover:scale-[1.025] hover:shadow-xl border-2 border-transparent hover:border-primary/30 relative group">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {client.first_name} {client.last_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        client.role === 'mechanic' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {client.role === 'admin' ? 'Админ' : client.role === 'mechanic' ? 'Механик' : 'Клиент'}
                      </span>
                      <span className="text-xs text-muted-foreground">ID: {client.id.slice(0, 8)}...</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {client.created_at && (
                        <span>Создан: {new Date(client.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="rounded-full p-2 bg-white hover:bg-blue-100 shadow border border-blue-200 hover:text-blue-600 text-blue-400 transition"
                    title="Редактировать"
                    onClick={() => { setIsEditDialogOpen(true); setEditingClient(client); }}
                    type="button"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-full p-2 bg-white hover:bg-green-100 shadow border border-green-200 hover:text-green-600 text-green-500 transition"
                    title="Написать сообщение"
                    onClick={() => { setMessageDialogOpen(true); setEditingClient(client); }}
                    type="button"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="flex items-center gap-2 text-sm">
                  <span>{client.email || 'Email не указан'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{client.phone || 'Телефон не указан'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>Авто: {client.vehicles?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Модальное окно редактирования клиента */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать клиента</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Измените данные клиента или его роль в системе
            </p>
          </DialogHeader>
          {editingClient && (
            <form onSubmit={handleEditClient} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">Имя</Label>
                <Input
                  id="edit_first_name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Фамилия</Label>
                <Input
                  id="edit_last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Телефон</Label>
                <Input
                  id="edit_phone"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_role">Роль</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value: 'admin' | 'client' | 'mechanic') => setEditForm({ ...editForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Клиент</SelectItem>
                    <SelectItem value="mechanic">Механик</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Модальное окно отправки сообщения клиенту */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сообщение клиенту</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <Label htmlFor="message_content">Текст сообщения</Label>
                <Textarea id="message_content" value={messageText} onChange={e => setMessageText(e.target.value)} required />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setMessageDialogOpen(false)}>Отмена</Button>
                <Button type="submit">Отправить</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClients;
