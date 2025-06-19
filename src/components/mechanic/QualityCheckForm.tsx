
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckIcon, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface QualityCheckFormProps {
  workOrderId: string;
  onSuccess?: () => void;
}

const QualityCheckForm = ({ workOrderId, onSuccess }: QualityCheckFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState("");
  const [passed, setPassed] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passed === null) {
      toast({
        title: "Выберите результат проверки",
        description: "Пожалуйста, укажите прошла ли работа проверку качества",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Add status update
      const { error } = await supabase
        .from('order_status_updates')
        .insert({
          work_order_id: workOrderId,
          created_by: user?.id,
          status: passed ? 'quality_passed' : 'quality_failed',
          comment: comments.trim() || (passed ? 'Работа прошла проверку качества' : 'Работа не прошла проверку качества')
        });

      if (error) throw error;

      // Update work order status
      await supabase
        .from('work_orders')
        .update({ 
          status: passed ? 'completed' : 'rework_needed'
        })
        .eq('id', workOrderId);

      toast({
        title: passed ? "Проверка пройдена" : "Требуется доработка",
        description: passed 
          ? "Работа успешно прошла контроль качества" 
          : "Работа отправлена на доработку",
      });

      // Reset form
      setComments("");
      setPassed(null);
      
      // Execute success callback if provided
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error submitting quality check:", error);
      toast({
        title: "Ошибка при отправке проверки",
        description: "Пожалуйста, попробуйте еще раз позже",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4">
        <Button
          type="button"
          variant={passed === true ? "default" : "outline"}
          className={`flex-1 ${passed === true ? "bg-green-600 hover:bg-green-700" : ""}`}
          onClick={() => setPassed(true)}
        >
          <CheckIcon className="h-5 w-5 mr-2" />
          Контроль пройден
        </Button>
        
        <Button
          type="button"
          variant={passed === false ? "default" : "outline"}
          className={`flex-1 ${passed === false ? "bg-amber-600 hover:bg-amber-700" : ""}`}
          onClick={() => setPassed(false)}
        >
          <AlertTriangle className="h-5 w-5 mr-2" />
          Требуется доработка
        </Button>
      </div>

      <div>
        <Textarea
          placeholder="Комментарии к проверке качества (необязательно)"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={submitting || passed === null}
      >
        {submitting ? "Отправка..." : "Отправить результат проверки"}
      </Button>
    </form>
  );
};

export default QualityCheckForm;
