import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminMessengerBadge({ userId, children }: { userId: string, children: (count: number) => React.ReactNode }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    // Получить количество непрочитанных сообщений
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("is_read", false)
      .then(({ count }) => {
        setCount(count || 0);
      });
    // Подписка на новые сообщения
    const sub = supabase
      .channel('messages-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if (msg.receiver_id === userId && msg.is_read === false) {
          setCount((c) => c + 1);
        }
      })
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [userId]);

  return children(count);
}
