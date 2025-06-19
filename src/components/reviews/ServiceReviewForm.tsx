
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StarIcon } from "lucide-react";

interface ServiceReviewFormProps {
  workOrderId: string;
  onSuccess?: () => void;
}

const ServiceReviewForm = ({ workOrderId, onSuccess }: ServiceReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Необходима авторизация",
        description: "Пожалуйста, войдите в систему чтобы оставить отзыв",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Выберите оценку",
        description: "Пожалуйста, укажите рейтинг от 1 до 5 звезд",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          work_order_id: workOrderId,
          rating: rating,
          comment: comment.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Отзыв успешно отправлен",
        description: "Спасибо за ваш отзыв о выполненной работе",
      });

      // Reset form
      setRating(0);
      setComment("");
      
      // Execute success callback if provided
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Ошибка при отправке отзыва",
        description: "Пожалуйста, попробуйте еще раз позже",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Как бы вы оценили качество выполненных работ?</p>
        <div className="flex justify-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-2xl focus:outline-none"
            >
              <StarIcon 
                className={`h-8 w-8 ${
                  (hoverRating || rating) >= star 
                    ? "text-yellow-400 fill-yellow-400" 
                    : "text-gray-300"
                }`} 
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-2 text-sm font-medium">
            {rating === 5 ? "Отлично!" : 
             rating === 4 ? "Хорошо" : 
             rating === 3 ? "Нормально" : 
             rating === 2 ? "Плохо" : 
             "Очень плохо"}
          </p>
        )}
      </div>

      <div>
        <Textarea
          placeholder="Расскажите о вашем опыте обслуживания (необязательно)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={submitting || rating === 0}
      >
        {submitting ? "Отправка..." : "Отправить отзыв"}
      </Button>
    </form>
  );
};

export default ServiceReviewForm;
