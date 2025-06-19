import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, User, Phone, Mail, Plus, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

interface Mechanic {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'mechanic';
  created_at: string | null;
  updated_at: string | null;
}

interface MechanicWithEmail extends Mechanic {
  email: string;
}

const AdminMechanics = () => {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMechanic, setNewMechanic] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  });

  // Новые состояния для модалок и форм
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', email: '', role: 'mechanic' });
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    fetchMechanics();
  }, []);

  // Синхронизация формы редактирования с выбранным механиком
  useEffect(() => {
    if (selectedMechanic) {
      setEditForm({
        first_name: selectedMechanic.first_name || '',
        last_name: selectedMechanic.last_name || '',
        phone: selectedMechanic.phone || '',
        email: (selectedMechanic as any).email || '',
        role: selectedMechanic.role || 'mechanic',
      });
    }
  }, [selectedMechanic]);

  // Обработчик редактирования механика
  const handleEditMechanic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMechanic) return;
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
        .eq('id', selectedMechanic.id);
      if (error) throw error;
      setEditModalOpen(false);
      setSelectedMechanic(null);
      fetchMechanics();
      // Можно добавить toast
    } catch (err) {
      // Можно добавить toast
      console.error('Ошибка при редактировании механика:', err);
    }
  };

  // Обработчик отправки сообщения механику
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMechanic) return;
    try {
      // Получаем текущего пользователя (админа)
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error('Не удалось определить отправителя');
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: userData.user.id,
          receiver_id: selectedMechanic.id,
          content: messageText,
        });
      if (error) throw error;
      setMessageModalOpen(false);
      setSelectedMechanic(null);
      setMessageText('');
      // Можно добавить toast
    } catch (err) {
      // Можно добавить toast
      console.error('Ошибка при отправке сообщения:', err);
    }
  };


  const fetchMechanics = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'mechanic')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMechanics(data || []);
    } catch (error) {
      console.error('Error fetching mechanics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMechanic = async () => {
    try {
      // Сначала создаем пользователя в auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newMechanic.email,
        password: Math.random().toString(36).slice(-8), // Генерируем случайный пароль
      });

      if (authError) throw authError;

      if (!authData.user?.id) {
        throw new Error('Failed to create user');
      }

      // Затем создаем профиль механика
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: newMechanic.first_name,
          last_name: newMechanic.last_name,
          phone: newMechanic.phone || null,
          role: 'mechanic' as const,
        });

      if (profileError) throw profileError;

      // Очищаем форму и обновляем список
      setNewMechanic({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
      });
      fetchMechanics();
    } catch (error) {
      console.error('Error adding mechanic:', error);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Управление механиками</h1>
        <p className="text-muted-foreground">
          Добавление и управление механиками автосервиса
        </p>
      </div>

      <div className="mb-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Добавить механика
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить нового механика</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Имя</Label>
                <Input
                  id="first_name"
                  value={newMechanic.first_name}
                  onChange={(e) => setNewMechanic({ ...newMechanic, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Фамилия</Label>
                <Input
                  id="last_name"
                  value={newMechanic.last_name}
                  onChange={(e) => setNewMechanic({ ...newMechanic, last_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={newMechanic.phone}
                  onChange={(e) => setNewMechanic({ ...newMechanic, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMechanic.email}
                  onChange={(e) => setNewMechanic({ ...newMechanic, email: e.target.value })}
                />
              </div>
              <Button onClick={handleAddMechanic} className="w-full">
                Добавить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mechanics.map((mechanic) => (
          <Card key={mechanic.id} className="transition-transform hover:scale-[1.025] hover:shadow-xl border-2 border-transparent hover:border-primary/30 relative group">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {mechanic.first_name} {mechanic.last_name}
                  </CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">
                    ID: {mechanic.id.slice(0, 8)}...<br/>
                    {mechanic.created_at && (
                      <span>Создан: {new Date(mechanic.created_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="rounded-full p-2 bg-white hover:bg-blue-100 shadow border border-blue-200 hover:text-blue-600 text-blue-400 transition"
                  title="Редактировать"
                  onClick={() => { setEditModalOpen(true); setSelectedMechanic(mechanic); }}
                  type="button"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  className="rounded-full p-2 bg-white hover:bg-green-100 shadow border border-green-200 hover:text-green-600 text-green-500 transition"
                  title="Написать сообщение"
                  onClick={() => { setMessageModalOpen(true); setSelectedMechanic(mechanic); }}
                  type="button"
                >
                  <Mail className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{mechanic.phone || 'Телефон не указан'}</span>
              </div>
              {('email' in mechanic) && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{(mechanic as any).email || 'Email не указан'}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Модальное окно редактирования механика */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать механика</DialogTitle>
          </DialogHeader>
          {selectedMechanic && (
            <form onSubmit={handleEditMechanic} className="space-y-4">
              <div>
                <Label htmlFor="edit_first_name">Имя</Label>
                <Input id="edit_first_name" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="edit_last_name">Фамилия</Label>
                <Input id="edit_last_name" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="edit_phone">Телефон</Label>
                <Input id="edit_phone" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input id="edit_email" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit_role">Роль</Label>
                <select id="edit_role" className="border rounded px-3 py-2 w-full" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value as any })}>
                  <option value="mechanic">Механик</option>
                  <option value="client">Клиент</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditModalOpen(false)}>Отмена</Button>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Модальное окно отправки сообщения механику */}
      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сообщение механику</DialogTitle>
          </DialogHeader>
          {selectedMechanic && (
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <Label htmlFor="message_content">Текст сообщения</Label>
                <Textarea id="message_content" value={messageText} onChange={e => setMessageText(e.target.value)} required />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setMessageModalOpen(false)}>Отмена</Button>
                <Button type="submit">Отправить</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMechanics;
