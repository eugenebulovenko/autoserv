import React, { useEffect, useState } from "react";
import { getRuStatusText } from "../utils/statusUtils";
import { formatDate } from "../utils/dateUtils";
import { supabase } from "../lib/supabase";
import { Progress } from "./ui/progress";
import { CheckCircle, Circle } from "lucide-react";
import { Badge } from "./ui/badge";
import { formatCurrency } from "@/lib/utils";

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

interface ServiceTrackerProps {
  workOrder: {
    id: string;
    order_number: string;
    created_at: string;
    description: string | null;
    total_cost: number | null;
    appointments?: {
      profiles: {
        first_name: string;
        last_name: string;
        phone: string | null;
      };
      vehicles?: {
        make: string;
        model: string;
        year: number;
      };
      date?: string;
      time?: string;
      services?: string;
    };
    order_status_updates?: Array<{
      status: string;
      created_at: string;
      profiles?: {
        first_name: string;
        last_name: string;
      };
      comment?: string;
    }>;
  } | null;
}

/**
 * Компонент для отслеживания этапов работ по заказу
 * @param workOrder - Данные о заказе
 * @returns JSX элемент с информацией о заказе
 */
const ServiceTracker: React.FC<ServiceTrackerProps> = ({ workOrder }) => {
  const [workStages, setWorkStages] = useState<WorkOrderStage[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchWorkStages = async () => {
      if (!workOrder || !workOrder.id) return;
      
      try {
        setLoading(true);
        
        // Получаем этапы для текущего заказ-наряда
        const { data, error } = await supabase
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
          .eq('work_order_id', workOrder.id)
          .order('stage(order_index)', { ascending: true });
        
        if (error) throw error;
        
        setWorkStages(data || []);
      } catch (error) {
        console.error('Error fetching work stages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkStages();
  }, [workOrder]);
  
  if (!workOrder) {
    return <div className="text-center py-6">Информация о заказе не найдена.</div>;
  }
  
  const { 
    order_number,
    created_at,
    description,
    total_cost,
    appointments,
    order_status_updates
  } = workOrder;
  
  const lastStatus = order_status_updates && order_status_updates.length > 0
    ? order_status_updates[order_status_updates.length - 1]
    : null;
    
  // Вычисляем прогресс выполнения работ
  const calculateProgress = () => {
    if (!workStages.length) return 0;
    const completedStages = workStages.filter(s => s.is_completed).length;
    return Math.round((completedStages / workStages.length) * 100);
  };
  
  return (
    <div className="glass rounded-xl p-8">
      <h2 className="text-xl font-semibold mb-4">Информация о заказе № {order_number}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-muted-foreground">Дата создания: {formatDate(created_at)}</p>
          <p className="text-muted-foreground">Описание: {description || "Нет описания"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Общая стоимость: {formatCurrency(total_cost ?? 0)}</p>
          {lastStatus && (
            <p className="text-muted-foreground">
              Текущий статус: <span className="font-medium">{getRuStatusText(lastStatus.status)}</span>
            </p>
          )}
        </div>
      </div>
      
      {appointments ? (
        <>
          <h3 className="text-lg font-semibold mb-3">Запись на обслуживание:</h3>
          <div className="mb-4 p-4 rounded-md bg-secondary/30">
            {appointments.date && appointments.time && (
              <p className="text-sm text-muted-foreground">
                Дата и время: {formatDate(appointments.date)} {appointments.time}
              </p>
            )}
            {appointments.vehicles && (
              <p className="text-sm text-muted-foreground">
                Автомобиль: {appointments.vehicles.make} {appointments.vehicles.model} ({appointments.vehicles.year})
              </p>
            )}
            {appointments.profiles && (
              <p className="text-sm text-muted-foreground">
                Клиент: {appointments.profiles.first_name} {appointments.profiles.last_name}
              </p>
            )}
            {appointments.services && (
              <p className="text-sm text-muted-foreground">
                Услуги: {appointments.services}
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">Нет информации о записи на обслуживание.</p>
      )}
      
      {workStages.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-6 mb-3">Этапы выполнения работ:</h3>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Прогресс выполнения</span>
              <span className="text-sm font-medium">{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
          
          <div className="space-y-3 mb-6">
            {workStages.map((stage) => (
              <div 
                key={stage.id} 
                className={`p-3 rounded-md ${stage.is_completed ? 'bg-green-50/30' : 'bg-secondary/20'}`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-1">
                    {stage.is_completed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {stage.stage.name}
                      {stage.is_completed && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Завершен
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stage.stage.description}
                    </p>
                    {stage.completed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Завершен: {formatDate(stage.completed_at)}
                      </p>
                    )}
                    {stage.comments && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Комментарий: {stage.comments}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {order_status_updates && order_status_updates.length > 0 ? (
        <>
          <h3 className="text-lg font-semibold mt-6 mb-3">История статусов:</h3>
          <div className="space-y-3">
            {order_status_updates.map((status) => (
              <div key={status.created_at} className="p-3 rounded-md bg-secondary/20">
                <p className="text-sm">
                  Статус: <span className="font-medium">{getRuStatusText(status.status)}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Дата обновления: {formatDate(status.created_at)}
                </p>
                {status.profiles && (
                  <p className="text-xs text-muted-foreground">
                    Обновил: {status.profiles.first_name} {status.profiles.last_name}
                  </p>
                )}
                {status.comment && (
                  <p className="text-xs text-muted-foreground">
                    Комментарий: {status.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-muted-foreground mt-6">Нет истории изменения статусов.</p>
      )}
    </div>
  );
};

export default ServiceTracker;
