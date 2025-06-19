import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { WorkOrderComment } from '@/types/workOrder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CommentListProps {
  workOrderId: string;
}

const CommentList = ({ workOrderId }: CommentListProps) => {
  const [comments, setComments] = useState<WorkOrderComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();

    // Подписываемся на изменения комментариев в реальном времени
    const channel = supabase
      .channel('work-order-comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_order_comments',
          filter: `work_order_id=eq.${workOrderId}`,
        },
        (payload) => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [workOrderId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('work_order_comments')
        .select(`
          *,
          users:profiles!work_order_comments_user_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('work_order_id', workOrderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Комментарии</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Нет комментариев</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`https://ui-avatars.com/api/?name=${comment.user?.first_name || 'User'}+${comment.user?.last_name || ''}`} />
                  <AvatarFallback>{comment.user?.first_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">
                      {comment.user?.first_name} {comment.user?.last_name}
                    </h4>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(comment.created_at), 'd MMMM yyyy HH:mm', { locale: ru })}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommentList;
