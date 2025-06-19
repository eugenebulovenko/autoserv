import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, CheckSquare, ClipboardList, Clock, Car } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WorkOrder {
  id: string;
  status: string;
  created_at: string;
  total_cost: number;
  appointment_id: string;
  order_number?: string;
  appointments?: {
    id: string;
    appointment_date: string;
    start_time: string;
    vehicle_id: string;
    vehicles?: {
      make: string;
      model: string;
      year: number;
    };
    profiles?: {
      first_name: string;
      last_name: string;
      phone: string;
    };
  };
}

const MechanicHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
  });
  const [nextTask, setNextTask] = useState<WorkOrder | null>(null);
  const [allTasks, setAllTasks] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Получаем все задания механика
        const { data: allTasksData, error: allTasksError } = await supabase
          .from("work_orders")
          .select(`
            id,
            status,
            created_at,
            total_cost,
            appointment_id
          `)
          .eq("mechanic_id", user.id)
          .order('created_at', { ascending: false });

        if (allTasksError) throw allTasksError;

        // Обрабатываем все задания
        if (allTasksData && allTasksData.length > 0) {
          const processedTasks = await Promise.all(allTasksData.map(async (task) => {
            // Проверяем, что appointment_id не null
            if (!task.appointment_id) {
              console.log("Task without appointment_id:", task.id);
              return { ...task, order_number: task.id };
            }
            
            // Получаем информацию о записи
            try {
              const { data: appointmentData, error: appointmentError } = await supabase
                .from("appointments")
                .select(`
                  id,
                  appointment_date,
                  start_time,
                  vehicle_id,
                  profiles!appointments_user_id_fkey(
                    first_name,
                    last_name,
                    phone
                  )
                `)
                .eq("id", task.appointment_id)
                .single();

              if (appointmentError) {
                console.error("Error fetching appointment:", appointmentError);
                return { ...task, order_number: task.id };
              }
              
              // Проверяем, что vehicle_id не null
              if (!appointmentData.vehicle_id) {
                console.log("Appointment without vehicle_id:", appointmentData.id);
                return { 
                  ...task, 
                  order_number: task.id,
                  appointments: appointmentData
                };
              }

              // Получаем информацию об автомобиле
              try {
                const { data: vehicleData, error: vehicleError } = await supabase
                  .from("vehicles")
                  .select(`
                    make,
                    model,
                    year
                  `)
                  .eq("id", appointmentData.vehicle_id)
                  .single();

                if (vehicleError) {
                  console.error("Error fetching vehicle:", vehicleError);
                  return { 
                    ...task, 
                    order_number: task.id,
                    appointments: appointmentData
                  };
                }
                
                return {
                  ...task,
                  order_number: task.id,
                  appointments: {
                    ...appointmentData,
                    vehicles: vehicleData
                  }
                };
              } catch (error) {
                console.error("Error in vehicle fetch:", error);
                return { 
                  ...task, 
                  order_number: task.id,
                  appointments: appointmentData
                };
              }
            } catch (error) {
              console.error("Error in appointment fetch:", error);
              return { ...task, order_number: task.id };
            }

            // Этот код не будет достигнут, так как мы уже возвращаем результат в блоках try/catch
          }));

          setAllTasks(processedTasks);
          
          // Устанавливаем следующее задание (первое со статусом "created")
          const nextPendingTask = processedTasks.find(task => task.status === "created");
          setNextTask(nextPendingTask || null);
        } else {
          setAllTasks([]);
          setNextTask(null);
        }

        // Получаем статистику
        const { data: pendingCount, error: pendingError } = await supabase
          .from("work_orders")
          .select("id", { count: "exact" })
          .eq("mechanic_id", user.id)
          .eq("status", "created");

        if (pendingError) throw pendingError;

        const { data: inProgressCount, error: inProgressError } = await supabase
          .from("work_orders")
          .select("id", { count: "exact" })
          .eq("mechanic_id", user.id)
          .eq("status", "in_progress");

        if (inProgressError) throw inProgressError;

        const { data: completedCount, error: completedError } = await supabase
          .from("work_orders")
          .select("id", { count: "exact" })
          .eq("mechanic_id", user.id)
          .eq("status", "completed");

        if (completedError) throw completedError;

        setStats({
          pendingTasks: pendingCount?.length || 0,
          inProgressTasks: inProgressCount?.length || 0,
          completedTasks: completedCount?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching mechanic data:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Панель механика</h1>
        <p className="text-muted-foreground">
          Обзор ваших текущих и предстоящих заданий
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ClipboardList className="mr-2 h-4 w-4 text-primary" />
              Ожидают выполнения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.pendingTasks}</div>
            <p className="text-muted-foreground text-sm">
              Назначенных заданий
            </p>
            <Button variant="ghost" size="sm" asChild className="mt-2 h-7 px-2 text-xs">
              <Link to="/mechanic/tasks">Просмотреть</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              В работе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.inProgressTasks}</div>
            <p className="text-muted-foreground text-sm">
              Заданий в процессе
            </p>
            <Button variant="ghost" size="sm" asChild className="mt-2 h-7 px-2 text-xs">
              <Link to="/mechanic/tasks">Просмотреть</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckSquare className="mr-2 h-4 w-4 text-primary" />
              Выполнено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.completedTasks}</div>
            <p className="text-muted-foreground text-sm">
              Завершенных заданий
            </p>
            <Button variant="ghost" size="sm" asChild className="mt-2 h-7 px-2 text-xs">
              <Link to="/mechanic/completed">История</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="next" className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Задания</h2>
          <TabsList>
            <TabsTrigger value="next">Следующее</TabsTrigger>
            <TabsTrigger value="all">Все задания</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="next">
          {nextTask ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Заказ #{nextTask.order_number}</h3>
                    <p className="text-muted-foreground mb-4">
                      {nextTask.appointments?.vehicles?.make} {nextTask.appointments?.vehicles?.model} ({nextTask.appointments?.vehicles?.year})
                    </p>
                    <div className="flex items-center mb-4">
                      <Calendar className="h-4 w-4 text-primary mr-2" />
                      <span>{nextTask.appointments?.appointment_date && formatDate(nextTask.appointments.appointment_date)}</span>
                      <span className="mx-2">•</span>
                      <span>{nextTask.appointments?.start_time}</span>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      nextTask.status === 'created' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : nextTask.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {nextTask.status === 'created' 
                        ? 'Ожидает начала' 
                        : nextTask.status === 'in_progress'
                          ? 'В работе'
                          : 'Выполнено'}
                    </span>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Button asChild>
                      <Link to={`/mechanic/tasks/${nextTask.id}`}>
                        {nextTask.status === 'created' ? 'Начать работу' : 'Продолжить работу'}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <div className="mb-4 text-muted-foreground">
                  <CheckSquare className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg">У вас нет назначенных заданий</p>
                  <p className="mt-2">Новые задания будут отображаться здесь</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="all">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : allTasks.length > 0 ? (
            <div className="space-y-4">
              {allTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Заказ #{task.order_number}</h3>
                        <p className="text-muted-foreground mb-4">
                          {task.appointments?.vehicles ? (
                            <>
                              {task.appointments.vehicles.make} {task.appointments.vehicles.model} ({task.appointments.vehicles.year})
                            </>
                          ) : (
                            "Информация о транспортном средстве недоступна"
                          )}
                        </p>
                        <div className="flex items-center mb-4">
                          <Calendar className="h-4 w-4 text-primary mr-2" />
                          <span>{task.appointments?.appointment_date && formatDate(task.appointments.appointment_date)}</span>
                          <span className="mx-2">•</span>
                          <span>{task.appointments?.start_time || "Время не указано"}</span>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                          task.status === 'created' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : task.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {task.status === 'created' 
                            ? 'Ожидает начала' 
                            : task.status === 'in_progress'
                              ? 'В работе'
                              : 'Выполнено'}
                        </span>
                      </div>
                      <div className="mt-4 md:mt-0">
                        <Button asChild>
                          <Link to={`/mechanic/tasks/${task.id}`}>
                            {task.status === 'created' 
                              ? 'Начать работу' 
                              : task.status === 'in_progress'
                                ? 'Продолжить работу'
                                : 'Просмотреть детали'}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <div className="mb-4 text-muted-foreground">
                  <Car className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg">У вас нет заданий</p>
                  <p className="mt-2">История заданий будет отображаться здесь</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MechanicHome;
