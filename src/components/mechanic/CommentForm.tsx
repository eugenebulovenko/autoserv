import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CommentFormProps {
  workOrderId: string;
}

const CommentForm = ({ workOrderId }: CommentFormProps) => {
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('work_order_comments')
        .insert({
          work_order_id: workOrderId,
          content,
        });

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Комментарий добавлен',
      });
      setContent('');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить комментарий',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Добавьте комментарий..."
          className="min-h-[100px]"
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Добавление...' : 'Добавить комментарий'}
      </Button>
    </form>
  );
};

export default CommentForm;
