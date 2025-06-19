import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Mail } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  role: string;
}

export default function ClientMessenger() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState<{ [userId: string]: number }>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id);
    });
  }, []);

  // Для клиентов отображаем только админов и механиков в списке пользователей
  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role")
      .then(({ data }) => {
        if (data) setUsers(data.filter((u: Profile) => u.id !== currentUserId && (u.role === 'admin' || u.role === 'mechanic')));
      });
  }, [currentUserId]);

  useEffect(() => {
    if (!selectedUser || !currentUserId) return;
    setLoading(true);
    supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order("created_at", { ascending: true })
      .then(async ({ data }) => {
        if (data) {
          setMessages(data.filter(
            (msg: Message) =>
              (msg.sender_id === currentUserId && msg.receiver_id === selectedUser.id) ||
              (msg.sender_id === selectedUser.id && msg.receiver_id === currentUserId)
          ));
          // Пометить как прочитанные все сообщения от selectedUser к текущему пользователю
          const unreadIds = data.filter(
            (msg: any) => msg.sender_id === selectedUser.id && msg.receiver_id === currentUserId && msg.is_read === false
          ).map((msg: any) => msg.id);
          if (unreadIds.length > 0) {
            await supabase
              .from("messages")
              .update({ is_read: true })
              .in("id", unreadIds);
          }
        }
        setLoading(false);
      });
  }, [selectedUser, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const sub = supabase
      .channel('messages-client')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        if (msg.receiver_id === currentUserId) {
          toast.info('Новое сообщение!');
          setUnread((prev) => ({ ...prev, [msg.sender_id]: (prev[msg.sender_id] || 0) + 1 }));
        }
      })
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [currentUserId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !currentUserId || !newMessage.trim()) return;
    const { error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: selectedUser.id,
      content: newMessage.trim(),
    });
    if (!error) {
      setNewMessage("");
      setMessages((msgs) => [...msgs, {
        id: Math.random().toString(),
        sender_id: currentUserId,
        receiver_id: selectedUser.id,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
      }]);
    } else {
      toast.error("Ошибка отправки сообщения");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[80vh]">
      <div className="w-full md:w-1/3 border-r bg-muted/30 overflow-y-auto">
        <div className="p-4 font-semibold text-lg">С кем связаться</div>
        {users.map((user) => (
          <div
            key={user.id}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-primary/10 transition relative ${selectedUser?.id === user.id ? 'bg-primary/10' : ''}`}
            onClick={() => { setSelectedUser(user); if (unread[user.id]) setUnread((prev) => ({ ...prev, [user.id]: 0 })); }}
          >
            <User className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <div className="font-medium">{user.first_name} {user.last_name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
              <div className="text-xs text-muted-foreground">{user.role === 'admin' ? 'Администратор' : 'Механик'}</div>
            </div>
            {unread[user.id] > 0 && (
              <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs absolute top-2 right-2">{unread[user.id]}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col h-full">
        <div className="border-b px-4 py-2 bg-white font-semibold">
          {selectedUser ? (
            <span>Чат с {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.role === 'admin' ? 'Администратор' : 'Механик'})</span>
          ) : (
            <span>Выберите, с кем хотите пообщаться</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/10">
          {loading ? (
            <div className="text-center text-muted-foreground">Загрузка...</div>
          ) : (
            messages.length === 0 ? (
              <div className="text-center text-muted-foreground">Нет сообщений</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[70%] px-4 py-2 rounded-lg shadow text-sm mb-1 ${msg.sender_id === currentUserId ? 'bg-primary text-white ml-auto' : 'bg-white text-black'}`}
                >
                  {msg.content}
                  <div className="text-[10px] text-muted-foreground mt-1 text-right">
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )
          )}
        </div>
        {selectedUser && (
          <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t bg-white">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Введите сообщение..."
              className="flex-1"
              autoFocus
            />
            <Button type="submit" disabled={!newMessage.trim()}>
              <Mail className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
