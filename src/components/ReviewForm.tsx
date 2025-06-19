
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
  workOrderId: string;
  userId: string;
  onSuccess?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ workOrderId, userId, onSuccess }) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleMouseEnter = (star: number) => {
    setHoveredRating(star);
  };

  const handleMouseLeave = () => {
    setHoveredRating(null);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите рейтинг",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase.from("reviews").insert({
        work_order_id: workOrderId,
        user_id: userId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Отзыв отправлен",
        description: "Спасибо за ваш отзыв!",
      });

      // Reset form
      setRating(0);
      setComment("");

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить отзыв. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => {
        const starValue = index + 1;
        const isFilled = (hoveredRating || rating) >= starValue;

        return (
          <Star
            key={index}
            size={28}
            fill={isFilled ? "currentColor" : "none"}
            className={`cursor-pointer transition-colors ${
              isFilled ? "text-yellow-400" : "text-gray-300"
            }`}
            onClick={() => handleRatingClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
          />
        );
      });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Оставить отзыв</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Оценка</label>
          <div className="flex space-x-2">{renderStars()}</div>
        </div>

        <div className="flex flex-col space-y-2">
          <label htmlFor="comment" className="text-sm font-medium">
            Комментарий (необязательно)
          </label>
          <Textarea
            id="comment"
            placeholder="Расскажите о вашем опыте..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Отправка..." : "Отправить отзыв"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReviewForm;
