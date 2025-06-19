import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCheck, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface QualityCheckProps {
  workOrderId: string;
  onComplete: () => void;
}

const QualityCheck = ({ workOrderId, onComplete }: QualityCheckProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState<"passed" | "issues">("passed");
  const [comments, setComments] = useState("");
  
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        toast({
          title: "Ошибка",
          description: "Необходимо авторизоваться",
          variant: "destructive"
        });
        return;
      }
      
      // Записываем проверку качества
      const { error: qualityError } = await supabase
        .from('quality_checks')
        .insert({
          work_order_id: workOrderId,
          checked_by: userId,
          status: quality,
          comments: comments,
          check_date: new Date().toISOString()
        });
      
      if (qualityError) throw qualityError;
      
      // Обновляем статус заказ-наряда
      const newStatus = quality === "passed" ? "quality_passed" : "quality_issues";
      
      const { error: updateError } = await supabase
        .from('work_orders')
        .update({ status: newStatus })
        .eq('id', workOrderId);
      
      if (updateError) throw updateError;
      
      // Добавляем обновление статуса
      await supabase
        .from('order_status_updates')
        .insert({
          work_order_id: workOrderId,
          created_by: userId,
          status: newStatus,
          comment: `Проверка качества: ${quality === "passed" ? "Успешно пройдена" : "Обнаружены проблемы"}. ${comments}`
        });
      
      toast({
        title: "Проверка завершена",
        description: quality === "passed" 
          ? "Работа успешно прошла проверку качества" 
          : "Отмечены проблемы в качестве работы"
      });
      
      onComplete();
    } catch (error) {
      console.error('Error submitting quality check:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить результаты проверки",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Проверка качества выполненных работ</CardTitle>
        <CardDescription>
          Оцените качество выполненных работ и оставьте комментарий
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 font-medium">Результат проверки:</div>
          <RadioGroup 
            value={quality} 
            onValueChange={(val) => setQuality(val as "passed" | "issues")}
            className="flex flex-col space-y-3"
          >
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="passed" id="passed" className="mt-1" />
              <div>
                <Label htmlFor="passed" className="flex items-center text-base">
                  <CheckCheck className="h-5 w-5 mr-2 text-green-500" />
                  Работа выполнена качественно
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Все работы выполнены согласно стандартам и требованиям заказчика
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="issues" id="issues" className="mt-1" />
              <div>
                <Label htmlFor="issues" className="flex items-center text-base">
                  <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                  Обнаружены проблемы
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  В работе найдены недостатки, требующие внимания
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>
        
        <div>
          <Label htmlFor="comments" className="mb-2 block">Комментарии по проверке:</Label>
          <Textarea
            id="comments"
            placeholder="Опишите результаты проверки..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "Сохранение..." : "Завершить проверку"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QualityCheck;
