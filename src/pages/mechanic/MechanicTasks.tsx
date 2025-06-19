import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Search, Car, Calendar, Clock, Wrench, User, AlertCircle } from "lucide-react";
import { PaginationParams } from "@/types/pagination";
import { cn, formatCurrency } from "@/lib/utils";
import { getRuStatusText } from "@/utils/statusUtils";

// Компонент для отображения статуса заказа
interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'created':
        return { label: getRuStatusText('created'), variant: 'secondary' as const, icon: <Clock className="h-4 w-4" /> };
      case 'in_progress':
        return { label: getRuStatusText('in_progress'), variant: 'default' as const, icon: <Wrench className="h-4 w-4" /> };
      case 'completed':
        return { label: getRuStatusText('completed'), variant: 'outline' as const, icon: <CheckCircle className="h-4 w-4" /> };
      case 'cancelled':
        return { label: getRuStatusText('cancelled'), variant: 'destructive' as const, icon: <AlertCircle className="h-4 w-4" /> };
      default:
        return { label: getRuStatusText(status), variant: 'secondary' as const, icon: <AlertCircle className="h-4 w-4" /> };
    }
  };
  
  const statusInfo = getStatusInfo(status);
  
  return (
    <div className="flex items-center gap-1">
      <Badge variant={statusInfo.variant} className="flex items-center gap-1 px-3">
        <div className="flex items-center gap-1">
          {statusInfo.icon}
          <span>{statusInfo.label}</span>
        </div>
      </Badge>
    </div>
  );
};

interface MechanicTasksProps {
  completed?: boolean;
}

interface WorkOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  mechanic_id: string;
  appointment_id: string;
  appointment?: {
    id: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: string;
    vehicle_id: string;
    vehicle?: {
      id: string;
      make: string;
      model: string;
      year: string;
      vin: string;
    };
    profiles?: {
      id: string;
      first_name: string;
      last_name: string;
      phone: string;
    }[];
    appointment_services?: {
      id: string;
      service_id: string;
      services?: {
        id: string;
        name: string;
        description: string;
        price: number;
      }[];
    }[];
  };
}

const MechanicTasks = ({ completed = false }: MechanicTasksProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: 20
  });
  const [tasks, setTasks] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTasks, setFilteredTasks] = useState<WorkOrder[]>([]);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const fetchTasks = async () => {
      setLoading(true);
      try {
        // Сначала получаем общее количество записей
        const { count, error: countError } = await supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .eq('mechanic_id', user.id)
          .in('status', completed ? ['completed', 'cancelled'] : ['created', 'in_progress']);

        if (countError) throw countError;
        
        setTotalPages(Math.ceil((count || 0) / pagination.pageSize));

        // Затем получаем конкретную страницу данных
        const { data, error } = await supabase
          .from('work_orders')
          .select(`
            *,
            appointment:appointments!work_orders_appointment_id_fkey(
              id,
              appointment_date,
              start_time,
              end_time,
              status,
              vehicle_id,
              vehicle:vehicles!appointments_vehicle_id_fkey(
                id,
                make,
                model,
                year,
                vin
              ),
              profiles:profiles!appointments_user_id_fkey(
                id,
                first_name,
                last_name,
                phone
              ),
              appointment_services(
                id,
                service_id,
                services:services(
                  id,
                  name,
                  description,
                  price
                )
              )
            )
          `)
          .eq('mechanic_id', user.id)
          .in('status', completed ? ['completed', 'cancelled'] : ['created', 'in_progress'])
          .order('created_at', { ascending: !completed })
          .range((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize - 1);
        
        if (error) throw error;
        
        setTasks(data || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список заданий",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [user, completed, pagination, toast]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTasks(tasks);
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = tasks.filter(task => {
      const vehicleInfo = task.appointment?.vehicle 
        ? `${task.appointment.vehicle.make} ${task.appointment.vehicle.model}`.toLowerCase()
        : '';
      const orderNumber = task.order_number?.toLowerCase() || '';
      
      return orderNumber.includes(lowercasedSearch) || 
             vehicleInfo.includes(lowercasedSearch);
    });
    
    setFilteredTasks(filtered);
  }, [searchTerm, tasks]);

  // Форматирование даты
  const formatDate = (date: string | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Форматирование времени
  const formatTime = (time: string | undefined): string => {
    if (!time) return '';
    return time;
  };

  // Получаем цвет границы для карточки в зависимости от статуса
  const getStatusBorderColor = (status: string): string => {
    switch(status) {
      case 'created':
        return "border-l-4 border-l-yellow-400";
      case 'in_progress':
        return "border-l-4 border-l-blue-400";
      case 'completed':
        return "border-l-4 border-l-green-400";
      case 'cancelled':
        return "border-l-4 border-l-red-400";
      default:
        return "";
    }
  };

  // Форматирование цены
  const formatPrice = (price: number | undefined): string => {
    if (price === undefined) return '';
    return formatCurrency(price);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{completed ? 'Завершенные задания' : 'Активные задания'}</h2>
        <div className="relative w-96">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск по номеру заказа или модели автомобиля..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8"
          />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Попробуйте изменить параметры поиска" 
                : completed 
                  ? "История выполненных работ будет отображаться здесь" 
                  : "Новые задания будут отображаться здесь"
              }
            </p>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Сбросить поиск
              </Button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <Link
              key={task.id}
              to={`/mechanic/tasks/${task.id}`}
              className="block"
            >
              <Card className={cn(
                "transition-all duration-200 hover:shadow-md",
                getStatusBorderColor(task.status)
              )}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {task.order_number}
                        <div className="ml-2">
                          <StatusBadge status={task.status} />
                        </div>
                      </CardTitle>
                      <CardDescription>
                        Создан: {new Date(task.created_at).toLocaleDateString('ru-RU')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary flex-shrink-0" />
                      <div>
                        <span className="font-medium">Автомобиль: </span>
                        {task.appointment?.vehicle ? (
                          <span className="text-gray-700">
                            {task.appointment.vehicle.make} {task.appointment.vehicle.model} ({task.appointment.vehicle.year})
                            {task.appointment.vehicle.vin && (
                              <span className="text-xs text-gray-500 block">VIN: {task.appointment.vehicle.vin}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Нет данных</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                      <div>
                        <span className="font-medium">Дата и время: </span>
                        {task.appointment?.appointment_date ? (
                          <span className="text-gray-700">
                            {formatDate(task.appointment.appointment_date)}, {formatTime(task.appointment.start_time)}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Не назначено</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Wrench className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <span className="font-medium">Услуги: </span>
                        {task.appointment?.appointment_services?.length ? (
                          <div className="text-gray-700">
                            {task.appointment.appointment_services.map((service, index) => (
                              <div key={service.id} className={index > 0 ? "mt-1" : ""}>
                                {service.services?.[0]?.name}
                                {service.services?.[0]?.price && (
                                  <span className="text-gray-500 ml-1 text-sm">
                                    ({formatPrice(service.services[0].price)})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">Услуги не указаны</span>
                        )}
                      </div>
                    </div>
                    
                    {task.appointment?.profiles?.[0] && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary flex-shrink-0" />
                        <div>
                          <span className="font-medium">Клиент: </span>
                          <span className="text-gray-700">
                            {task.appointment.profiles[0].first_name} {task.appointment.profiles[0].last_name}
                            {task.appointment.profiles[0].phone && (
                              <span className="text-xs text-gray-500 block">
                                Тел: {task.appointment.profiles[0].phone}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full">
                    {task.status === 'created' ? 'Начать работу' : 
                     task.status === 'in_progress' ? 'Продолжить работу' : 
                     'Просмотреть детали'}
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
          >
            Предыдущая
          </Button>
          <span className="text-sm text-gray-500">
            Страница {pagination.page} из {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === totalPages}
          >
            Следующая
          </Button>
        </div>
      )}
    </div>
  );
};

export default MechanicTasks;
