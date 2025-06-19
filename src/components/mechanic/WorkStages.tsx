import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Circle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface WorkStage {
  id: string;
  name: string;
  description: string;
  order_index: number;
}

interface WorkOrderStage {
  id: string;
  work_order_id: string;
  stage_id: string;
  is_completed: boolean;
  completed_at: string | null;
  comments: string | null;
  stage: WorkStage;
}

interface WorkStagesProps {
  workOrderId: string;
  onComplete: () => void;
  onStageChange?: (stageId: string, isCompleted: boolean) => void;
}

const WorkStages = ({ workOrderId, onComplete, onStageChange }: WorkStagesProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<WorkStage[]>([]);
  const [workOrderStages, setWorkOrderStages] = useState<WorkOrderStage[]>([]);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  
  // Получение всех этапов работ и статусов для текущего заказ-наряда
  useEffect(() => {
    const fetchStages = async () => {
      try {
        setLoading(true);
        
        // Получаем все возможные этапы работ
        const { data: stagesData, error: stagesError } = await supabase
          .from('work_stages')
          .select('*')
          .order('order_index', { ascending: true });
        
        if (stagesError) throw stagesError;
        
        // Получаем этапы для текущего заказ-наряда
        const { data: orderStagesData, error: orderStagesError } = await supabase
          .from('work_order_stages')
          .select(`
            id,
            work_order_id,
            stage_id,
            is_completed,
            completed_at,
            comments,
            stage:stage_id(*)
          `)
          .eq('work_order_id', workOrderId);
        
        if (orderStagesError) throw orderStagesError;
        
        setStages(stagesData || []);
        
        // Если у заказ-наряда еще нет этапов, создаем их
        if (!orderStagesData || orderStagesData.length === 0) {
          await initializeWorkOrderStages(stagesData || []);
        } else {
          setWorkOrderStages(orderStagesData);
          
          // Определяем активный этап (первый незавершенный)
          const activeStage = orderStagesData.find(stage => !stage.is_completed);
          if (activeStage) {
            setActiveStage(activeStage.stage_id);
          }
        }
      } catch (error) {
        console.error('Error fetching stages:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить этапы работ",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStages();
  }, [workOrderId, toast]);
  
  // Инициализация этапов работ для заказ-наряда
  const initializeWorkOrderStages = async (stages: WorkStage[]) => {
    try {
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
      
      const stageEntries = stages.map(stage => ({
        work_order_id: workOrderId,
        stage_id: stage.id,
        is_completed: false,
        created_by: userId
      }));
      
      const { data, error } = await supabase
        .from('work_order_stages')
        .insert(stageEntries)
        .select(`
          id,
          work_order_id,
          stage_id,
          is_completed,
          completed_at,
          comments,
          stage:stage_id(*)
        `);
      
      if (error) throw error;
      
      setWorkOrderStages(data || []);
      
      // Устанавливаем первый этап как активный
      if (data && data.length > 0) {
        setActiveStage(data[0].stage_id);
      }
    } catch (error) {
      console.error('Error initializing stages:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось инициализировать этапы работ",
        variant: "destructive"
      });
    }
  };
  
  // Обработка завершения этапа
  const handleCompleteStage = async (stageId: string) => {
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
      
      // Находим текущий этап в списке
      const currentStage = workOrderStages.find(s => s.stage_id === stageId);
      if (!currentStage) return;
      
      // Обновляем статус этапа
      const { error: updateError } = await supabase
        .from('work_order_stages')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          comments: comments
        })
        .eq('id', currentStage.id);
      
      if (updateError) throw updateError;
      
      // Добавляем запись в историю статусов
      const stageName = stages.find(s => s.id === stageId)?.name || 'Этап';
      try {
        const { error: statusError } = await supabase
          .from('order_status_updates')
          .insert({
            work_order_id: workOrderId,
            created_by: userId,
            status: `stage_${stageId}`,
            comment: `Завершен этап: ${stageName}. ${comments}`
          });
          
        if (statusError) {
          console.error('Error updating status history:', statusError);
          // Продолжаем выполнение, даже если не удалось добавить запись в историю
        }
      } catch (error) {
        console.error('Error updating status history:', error);
        // Продолжаем выполнение, даже если не удалось добавить запись в историю
      }
      
      // Обновляем локальное состояние
      setWorkOrderStages(prevStages => 
        prevStages.map(s => 
          s.id === currentStage.id 
            ? { ...s, is_completed: true, completed_at: new Date().toISOString(), comments } 
            : s
        )
      );
      
      // Находим следующий этап
      const currentStageIndex = stages.findIndex(s => s.id === stageId);
      const nextStage = stages[currentStageIndex + 1];
      
      if (nextStage) {
        setActiveStage(nextStage.id);
      } else {
        // Если это был последний этап, обновляем статус заказ-наряда
        const { error: workOrderError } = await supabase
          .from('work_orders')
          .update({ status: 'completed' })
          .eq('id', workOrderId);
        
        if (workOrderError) throw workOrderError;
        
        // Добавляем запись о завершении всех работ
        await supabase
          .from('order_status_updates')
          .insert({
            work_order_id: workOrderId,
            created_by: userId,
            status: 'completed',
            comment: 'Все этапы работ завершены'
          });
      }
      
      setComments("");
      
      toast({
        title: "Этап завершен",
        description: `Этап "${stageName}" успешно завершен`
      });
      
      if (onStageChange) {
        onStageChange(stageId, true);
      }
      
      // Если это был последний этап, вызываем колбэк завершения
      if (!nextStage) {
        onComplete();
      }
    } catch (error) {
      console.error('Error completing stage:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось завершить этап работы",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Вычисляем прогресс выполнения работ
  const calculateProgress = () => {
    if (!workOrderStages.length) return 0;
    const completedStages = workOrderStages.filter(s => s.is_completed).length;
    return Math.round((completedStages / workOrderStages.length) * 100);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Этапы выполнения работ</CardTitle>
        <CardDescription>
          Отметьте текущий этап выполнения работ по заказу
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Прогресс выполнения</span>
            <span className="text-sm font-medium">{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>
        
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const workOrderStage = workOrderStages.find(s => s.stage_id === stage.id);
            const isCompleted = workOrderStage?.is_completed || false;
            const isActive = activeStage === stage.id;
            
            return (
              <div 
                key={stage.id} 
                className={`p-4 rounded-md border ${isActive ? 'border-primary' : 'border-border'} ${isCompleted ? 'bg-muted/30' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : isActive ? (
                      <Circle className="h-5 w-5 text-blue-500 fill-blue-100" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-medium">
                        {index + 1}. {stage.name}
                      </h4>
                      {isCompleted ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Завершен
                        </Badge>
                      ) : isActive ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Текущий
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Ожидает
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stage.description}
                    </p>
                    
                    {workOrderStage?.comments && (
                      <div className="mt-2 p-2 bg-muted/20 rounded text-sm">
                        <span className="font-medium">Комментарий:</span> {workOrderStage.comments}
                      </div>
                    )}
                    
                    {isActive && !isCompleted && (
                      <div className="mt-3 space-y-3">
                        <Textarea
                          placeholder="Комментарий к этапу (опционально)..."
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          className="text-sm"
                        />
                        <Button 
                          onClick={() => handleCompleteStage(stage.id)} 
                          disabled={loading}
                          size="sm"
                        >
                          {loading ? "Сохранение..." : "Завершить этап"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkStages;
