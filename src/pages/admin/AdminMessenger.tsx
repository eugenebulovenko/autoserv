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
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  role: string;
}

export default function AdminMessenger() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState<{ [userId: string]: number }>({});

  // Получаем текущего пользователя
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id);
    });
  }, []);

  // Получаем список пользователей
  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role")
      .then(({ data }) => {
        if (data) setUsers(data.filter((u: Profile) => u.id !== currentUserId));
      });
  }, [currentUserId]);

  // Получаем сообщения (для выбранного пользователя) и помечаем их как прочитанные
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

  // Подписка на новые сообщения (реальное уведомление)
  useEffect(() => {
    if (!currentUserId) return;
    const sub = supabase
      .channel('messages')
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

  // Отправка сообщения
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
      {/* Список пользователей */}
      <div className="w-full md:w-1/3 border-r bg-muted/30 overflow-y-auto">
        <div className="p-4 font-semibold text-lg">Пользователи</div>
        {[...users]
  .sort((a, b) => (unread[b.id] || 0) - (unread[a.id] || 0))
  .map((user) => {
    // Определим, кто отправил последнее сообщение (если есть)
    const lastMsg = messages.filter(
      m => (m.sender_id === user.id || m.receiver_id === user.id)
    ).slice(-1)[0];
    const isLastFromUser = lastMsg && lastMsg.sender_id === user.id;
    return (
      <div
        key={user.id}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-primary/10 transition relative ${selectedUser?.id === user.id ? 'bg-primary/10' : ''}`}
        onClick={() => { setSelectedUser(user); if (unread[user.id]) setUnread((prev) => ({ ...prev, [user.id]: 0 })); }}
      >
        <User className={`h-6 w-6 ${isLastFromUser ? 'text-green-600' : 'text-primary'}`} />
        <div className="flex-1">
          <div className={`font-medium flex items-center gap-1 ${isLastFromUser ? 'font-bold' : ''}`}>
            {user.first_name} {user.last_name}
            {isLastFromUser && <span title="Последнее сообщение от пользователя" className="ml-1 text-green-600">●</span>}
          </div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
        {unread[user.id] > 0 && (
          <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs absolute top-2 right-2">{unread[user.id]}</span>
        )}
      </div>
    );
  })}

      </div>
      {/* Чат */}
      <div className="flex-1 flex flex-col h-full">
        <div className="border-b px-4 py-2 bg-white font-semibold">
          {selectedUser ? (
            <span>Чат с {selectedUser.first_name} {selectedUser.last_name}</span>
          ) : (
            <span>Выберите пользователя для общения</span>
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
                  className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 mb-1 max-w-[70%] ${msg.sender_id === currentUserId ? 'bg-blue-100 text-right' : 'bg-gray-200 text-left'}`}
                    style={{ wordBreak: 'break-word' }}
                  >
                    {msg.content}
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
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
