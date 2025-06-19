import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { WorkOrder } from "@/types/mechanic";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WorkStages from "../../components/mechanic/WorkStages";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getRuStatusText } from "@/utils/statusUtils";

interface QualityCheck {
  id: string;
  status: string;
  comments: string;
  check_date: string;
  work_order_id: string;
  checked_by: string;
}

const MechanicTaskDetails = () => {
  const { toast } = useToast();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  // const [userId, setUserId] = useState<string | null>(null);
  const [task, setTask] = useState<WorkOrder | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusChangeComment, setStatusChangeComment] = useState('');
  const [showWorkStages, setShowWorkStages] = useState(false);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  // const [selectedQualityCheck, setSelectedQualityCheck] = useState<QualityCheck | null>(null);

  // Делаем функцию fetchQualityChecks доступной во всём компоненте
  const fetchQualityChecks = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('quality_checks')
        .select('*')
        .eq('work_order_id', id);
      if (error) throw error;
      setQualityChecks(data || []);
    } catch (error) {
      console.error('Error fetching quality checks:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить контроль качества",
        variant: "destructive"
      });
    }
  };
  
  // Функция для обновления данных заказ-наряда
  const fetchTaskDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          work_order_services (
            *,
            services (*)
          ),
          appointments!work_orders_appointment_id_fkey (
            id,
            appointment_date,
            start_time,
            end_time,
            status,
            total_price,
            notes,
            vehicle_id,
            user_id,
            profiles (
              id,
              first_name,
              last_name,
              phone,
              email
            ),
            vehicles (
              id,
              make,
              model,
              year,
              license_plate,
              vin
            )
          ),
          mechanic:profiles!work_orders_mechanic_id_fkey (
            id,
            first_name,
            last_name,
            phone,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setTask(data as WorkOrder);
      await fetchQualityChecks();
    } catch (error) {
      console.error('Error fetching work order details:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить информацию о заказе",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const handleStatusChange = async () => {
    if (!id || !newStatus) return;
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Добавляем запись в историю статусов
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (userId) {
        await supabase
          .from('order_status_updates')
          .insert({
            work_order_id: id,
            created_by: userId,
            status: newStatus,
            comment: statusChangeComment
          });
      }

      // Обновляем локальное состояние
      setTask(prev => prev ? { ...prev, status: newStatus } : null);
      setShowStatusModal(false);
      setStatusChangeComment('');

      toast({
        title: "Статус обновлен",
        description: "Статус заказа успешно обновлен"
      });

      // Перезагружаем задачу
      fetchTaskDetails();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус",
        variant: "destructive"
      });
    }
  };
  
  // Обработчик завершения всех этапов работ
  const handleWorkStagesComplete = async () => {
    toast({
      title: "Все этапы завершены",
      description: "Все этапы работ по заказу успешно завершены"
    });
    
    // Закрываем диалог
    setShowWorkStages(false);
    
    // Перезагружаем задачу для обновления статуса
    fetchTaskDetails();
    
    // Обновляем список проверок качества
    fetchQualityChecks();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Заказ не найден</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Заказ №{task.order_number}</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowWorkStages(true)}
              className="w-full"
            >
              Просмотреть этапы работ
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Информация о заказе</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Статус:</span>
                <span className="font-medium">{getRuStatusText(task.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Начало работы:</span>
                <span className="font-medium">
                  {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'Не начато'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Дата создания:</span>
                <span className="font-medium">
                  {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Дата не указана'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Обновлено:</span>
                <span className="font-medium">
                  {task.updated_at ? new Date(task.updated_at).toLocaleDateString() : 'Не обновлялось'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Услуги</h2>
            <div className="space-y-4">
              {task.work_order_services?.map((ws) => (
                ws.services && (
                  <div key={ws.services.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{ws.services.name}</h3>
                    <p className="text-gray-600">{ws.services.description}</p>
                    <div className="flex justify-between mt-2">
                      <span>Стоимость: {formatCurrency(ws.services.price)}</span>
                      <span>Длительность: {ws.services.duration} ч</span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Проверки качества</h2>
          <div className="space-y-4">
            {qualityChecks.map((check) => (
              <div key={check.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Проверка {check.id}</h3>
                    <p className="text-gray-600">Статус: {getRuStatusText(check.status)}</p>
                  </div>
                  {check.status === 'pending' && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowWorkStages(true)}
  >
    Просмотреть этапы работ
  </Button>
)}
                </div>
                {check.comments && (
                  <div className="mt-2">
                    <p className="text-gray-600">Комментарии:</p>
                    <p className="mt-1">{check.comments}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменение статуса</DialogTitle>
            <DialogDescription>
              Здесь вы можете изменить статус текущего заказа.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select
              value={newStatus}
              onValueChange={setNewStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">В ожидании</SelectItem>
                <SelectItem value="in_progress">В работе</SelectItem>
                <SelectItem value="completed">Завершен</SelectItem>
                <SelectItem value="cancelled">Отменен</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Комментарий к изменению статуса..."
              value={statusChangeComment}
              onChange={(e) => setStatusChangeComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleStatusChange}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showWorkStages} onOpenChange={setShowWorkStages}>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <DialogTitle>Этапы выполнения работ</DialogTitle>
      <DialogDescription>
        Здесь вы можете отслеживать и обновлять этапы выполнения работ по заказу.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      {task && (
        <WorkStages
          workOrderId={task.id}
          onComplete={handleWorkStagesComplete}
        />
      )}
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
};

export default MechanicTaskDetails;
