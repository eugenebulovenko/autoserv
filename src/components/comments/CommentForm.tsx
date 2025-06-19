import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface CommentFormProps {
  workOrderId: string;
  onCommentAdded?: () => void;
}

export default function CommentForm({ workOrderId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error } = await supabase
        .from("work_order_comments")
        .insert({
          work_order_id: workOrderId,
          content,
          created_by: user?.user?.id
        });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Комментарий добавлен"
      });

      setContent("");
      onCommentAdded?.();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить комментарий",
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Введите комментарий..."
          className="w-full p-3 border rounded-md"
          rows={3}
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      >
        Добавить комментарий
      </button>
    </form>
  );
}
