import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getRuStatusText } from "../utils/statusUtils"; // Централизованный перевод статусов
import { formatCurrency } from "@/lib/utils";

import WorkOrderCard from "../components/WorkOrderCard";
import MainLayout from "@/layouts/MainLayout";
import CancelAppointmentDialog from "@/components/booking/CancelAppointmentDialog";
import { Button } from "@/components/ui/button";
import { Calendar, Car, Wrench, Settings, CheckCircle, Edit, Trash2, Plus } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { services } from "@/data/services";
import VehicleCrud from "@/components/VehicleCrud";

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  vehicles: Vehicle;
  appointment_services?: { service_id: string; price: number }[];
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  license_plate?: string;
}

// WorkOrder интерфейс больше не используется

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [serviceHistory, setServiceHistory] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [recommendedServices, setRecommendedServices] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  // const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]); // Удалить, если не используется
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.id) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      // 1. Автомобили пользователя
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id);
      if (vehiclesError) {
  console.error('vehiclesError:', vehiclesError, 'user:', user);
  throw vehiclesError;
}
      setVehicles(vehiclesData || []);
      // 2. Все записи пользователя (appointments) с авто
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*, vehicles:vehicle_id (id, make, model, year, vin, license_plate)')
        .eq('user_id', user.id);
      if (appointmentsError) {
  console.error('appointmentsError:', appointmentsError, 'user:', user);
  throw appointmentsError;
}
      setAppointments(appointmentsData || []);
      // 3. История обслуживания пользователя
      let historyData: any[] = [];
      let historyError = null;
      if (vehiclesData && vehiclesData.length > 0) {
        const vehicleIds = vehiclesData.map(v => v.id);
        const { data, error } = await supabase
          .from('service_history')
          .select('*')
          .in('vehicle_id', vehicleIds)
          .order('service_date', { ascending: false });
        historyData = data;
        historyError = error;
        if (historyError) {
          console.error('historyError:', historyError, 'user:', user, 'vehicleIds:', vehicleIds);
          throw historyError;
        }
      }
      setServiceHistory(historyData || []);
      // 4. Рекомендуемые услуги (top-5)
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .limit(5);
      if (servicesError) {
  console.error('servicesError:', servicesError, 'user:', user);
  throw servicesError;
}
      setRecommendedServices(servicesData || []);
      // 5. Активные заказы пользователя (appointments confirmed/in_progress, дата >= сегодня)
      const today = new Date().toISOString().slice(0, 10);
      const { data: activeOrdersData, error: activeOrdersError } = await supabase
        .from('appointments')
        .select('*, vehicles:vehicle_id (id, make, model, year, vin, license_plate)')
        .eq('user_id', user.id)
        .gte('appointment_date', today)
        .or('status.neq.completed,status.neq.cancelled');
      if (activeOrdersError) {
  console.error('activeOrdersError:', activeOrdersError, 'user:', user);
  throw activeOrdersError;
}
      setActiveOrders(activeOrdersData || []);
      // 6. Предстоящие записи (appointments с датой > сегодня и не completed)
      // Removed upcoming appointments fetch and setUpcomingAppointments, as the state is no longer used.
      // 7. Последние заказ-наряды пользователя
      let userWorkOrders: any[] = [];
      let completedWorkOrders: any[] = [];
      let userWorkOrdersError = null;
      let appointmentIds: string[] = [];
      if (appointmentsData && appointmentsData.length > 0) {
        appointmentIds = appointmentsData.map(a => a.id);
        if (appointmentIds.length > 0) {
          // Загружаем активные заказы (не завершенные)
          const { data: activeData, error: activeError } = await supabase
              .from('work_orders')
              .select(`
                *,
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
              .in('appointment_id', appointmentIds)
              .not('status', 'eq', 'completed')
              .order('created_at', { ascending: false })
              .limit(5);
          
          // Загружаем завершенные заказы
          const { data: completedData, error: completedError } = await supabase
              .from('work_orders')
              .select(`
                *,
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
              .in('appointment_id', appointmentIds)
              .eq('status', 'completed')
              .order('created_at', { ascending: false });
          
          userWorkOrders = activeData || [];
          completedWorkOrders = completedData || [];
          userWorkOrdersError = activeError || completedError;
          
          if (userWorkOrdersError) {
            console.error('userWorkOrdersError:', userWorkOrdersError, 'user:', user, 'appointmentIds:', appointmentIds);
            throw userWorkOrdersError;
          }
        }
      }
      setWorkOrders(userWorkOrders || []);
      setCompletedOrders(completedWorkOrders || []);
      // 8. Общая сумма заказов пользователя
      let totalAmountData: any[] = [];
      let totalAmountError = null;
      if (appointmentIds && appointmentIds.length > 0) {
        const { data, error } = await supabase
          .from('work_orders')
          .select('total_cost')
          .in('appointment_id', appointmentIds)
          .not('total_cost', 'is', null);
        totalAmountData = data;
        totalAmountError = error;
        if (totalAmountError) {
          console.error('totalAmountError:', totalAmountError, 'user:', user, 'appointmentIds:', appointmentIds);
          throw totalAmountError;
        }
      }
      setTotalAmount((totalAmountData || []).reduce((sum, order) => sum + (order.total_cost || 0), 0));
      // 9. Количество заказ-нарядов по статусам
      let allOrders: any[] = [];
      let allOrdersError = null;
      if (appointmentIds && appointmentIds.length > 0) {
        const { data, error } = await supabase
          .from('work_orders')
          .select('status')
          .in('appointment_id', appointmentIds);
        allOrders = data;
        allOrdersError = error;
        if (allOrdersError) {
          console.error('allOrdersError:', allOrdersError, 'user:', user, 'appointmentIds:', appointmentIds);
          throw allOrdersError;
        }
      }
      const counts = (allOrders || []).reduce((acc: Record<string, number>, { status }: { status: string }) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Не удалось загрузить данные дашборда');
    } finally {
      setLoading(false);
    }
  };


  if (loading) return <div className="flex justify-center items-center min-h-screen text-lg">Загрузка...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-lg text-red-600">{error}</div>;

  // Статусный бейдж
  const statusBadge = (status: string) => {
    const base = "px-2 py-1 rounded-full text-xs font-semibold inline-block";
    let badgeClass = "bg-gray-100 text-gray-800";
    switch (status) {
      case 'confirmed':
        badgeClass = "bg-blue-100 text-blue-800";
        break;
      case 'in_progress':
        badgeClass = "bg-yellow-100 text-yellow-800";
        break;
      case 'completed':
        badgeClass = "bg-green-100 text-green-800";
        break;
      case 'cancelled':
        badgeClass = "bg-red-100 text-red-800";
        break;
    }
    return <span className={`${base} ${badgeClass}`}>{getRuStatusText(status)}</span>;
  };

  // Функция для получения русского статуса (для прямого вывода, если потребуется)

  return (
    <MainLayout>
      <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 md:flex md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Личный кабинет</h1>
            <p className="text-foreground/70">
              Добро пожаловать! Управляйте своими записями и автомобилями
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button
              className="w-full md:w-auto rounded-xl shadow border border-primary bg-primary text-white hover:bg-primary/90 transition px-6 py-3 text-base font-semibold"
              size="lg"
              onClick={() => navigate('/booking')}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Записаться на сервис
            </Button>
          </div>
        </div>

        {/* Метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-300 text-white rounded-xl shadow p-6 flex flex-col items-start">
            <div className="flex items-center gap-2 mb-2">
              <Car className="h-6 w-6" />
              <span className="uppercase text-xs tracking-wider">Автомобили</span>
            </div>
            <div className="text-3xl font-bold">{vehicles.length}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-300 text-white rounded-xl shadow p-6 flex flex-col items-start">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-6 w-6" />
              <span className="uppercase text-xs tracking-wider">Записи</span>
            </div>
            <div className="text-3xl font-bold">{appointments.length}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-300 text-white rounded-xl shadow p-6 flex flex-col items-start">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-6 w-6" />
              <span className="uppercase text-xs tracking-wider">Активные заказы</span>
            </div>
            <div className="text-3xl font-bold">{activeOrders.length}</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-300 text-white rounded-xl shadow p-6 flex flex-col items-start">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-6 w-6" />
              <span className="uppercase text-xs tracking-wider">Сумма заказов</span>
            </div>
            <div className="text-3xl font-bold">{formatCurrency(totalAmount)}</div>
          </div>
        </div>

        {/* Статистика по статусам */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
              <div className="mb-1">{statusBadge(status)}</div>
              <div className="text-2xl font-bold">{count}</div>
            </div>
          ))}
        </div>

        {/* Основные таблицы */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <section className="bg-white rounded-xl shadow p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-500" /> Ваши автомобили
            </h2>
            <VehicleCrud vehicles={vehicles} setVehicles={setVehicles} />
          </section>

          {/* Активные заказы */}
          <section className="bg-white rounded-xl shadow p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-yellow-500" /> Активные заказы
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2">Дата</th>
                    <th className="px-2 py-2">Время</th>
                    <th className="px-2 py-2">Статус</th>
                    <th className="px-2 py-2">Цена</th>
                    <th className="px-2 py-2">Авто</th>
                    <th className="px-2 py-2">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {activeOrders.map((a) => (
                    <tr key={a.id} className="hover:bg-yellow-50 transition">
                      <td className="px-2 py-1">{a.appointment_date}</td>
                      <td className="px-2 py-1">{a.start_time} - {a.end_time}</td>
                      <td className="px-2 py-1">{statusBadge(a.status)}</td>
                      <td className="px-2 py-1">{formatCurrency(a.total_price)}</td>
                      <td className="px-2 py-1">{a.vehicles ? `${a.vehicles.make} ${a.vehicles.model} ${a.vehicles.year}` : '-'}</td>
                      <td className="px-2 py-1">
                        {a.status === 'pending' && (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        size="icon"
        variant="destructive"
        aria-label="Отменить запись"
        onClick={() => {
          setAppointmentToCancel(a.id);
          setCancelDialogOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Отменить запись</TooltipContent>
  </Tooltip>
)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" /> Последние заказ-наряды
            </h2>
            {workOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mb-2 text-gray-300" />
                <span>Нет заказ-нарядов</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workOrders.map((o) => (
                  <WorkOrderCard key={o.id} order={o} />
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-xl shadow p-6 flex flex-col mt-8">
            <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-500" /> История обслуживания
            </h3>
            {completedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Wrench className="h-12 w-12 mb-2 text-gray-300" />
                <span>Нет записей об обслуживании</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedOrders.map((order) => (
                  <div key={order.id} className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Заказ №{order.order_number}</h4>
                        <p className="text-sm text-gray-600">
                          {order.appointments && order.appointments.appointment_date ? 
                            new Date(order.appointments.appointment_date).toLocaleDateString() : 
                            new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{order.total_cost ? formatCurrency(order.total_cost) : 'Сумма не указана'}</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Завершен
                        </span>
                      </div>
                    </div>
                    
                    {order.appointments && order.appointments.vehicles && (
                      <div className="flex items-center gap-2 mt-1">
                        <Car className="h-4 w-4 text-gray-500" />
                        <p className="text-sm text-gray-600">
                          {order.appointments.vehicles.make} {order.appointments.vehicles.model} ({order.appointments.vehicles.year})
                        </p>
                      </div>
                    )}
                    
                    {order.notes && <p className="text-sm mt-1">{order.notes}</p>}
                    
                    {order.mechanic && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Механик: {order.mechanic.first_name} {order.mechanic.last_name}</p>
                      </div>
                    )}
                    
                    <div className="mt-2">
                      <Link 
                        to={`/service-history/${order.id}`} 
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Подробнее о заказе
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Рекомендуемые услуги */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Рекомендуемые услуги</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Замена масла и фильтров",
                description: "Рекомендуется каждые 10,000 км",
                icon: Wrench,
                priority: "Высокий",
                link: "/services/1",
              },
              {
                title: "Проверка тормозной системы",
                description: "Последняя проверка: 6 месяцев назад",
                icon: Wrench,
                priority: "Средний",
                link: "/services/2",
              },
              {
                title: "Сезонная смена шин",
                description: "Рекомендуется до наступления холодов",
                icon: Wrench,
                priority: "Низкий",
                link: "/services/3",
              },
            ].map((recommendation, index) => (
              <div key={index} className="overflow-hidden rounded-xl bg-white shadow border border-gray-200 flex flex-col">
                <div
                  className={`h-1 ${
                    recommendation.priority === "Высокий"
                      ? "bg-red-500"
                      : recommendation.priority === "Средний"
                      ? "bg-orange-500"
                      : "bg-blue-500"
                  }`}
                />
                <div className="pt-6 px-6 pb-4 flex-1 flex flex-col justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`shrink-0 rounded-full p-2 ${
                        recommendation.priority === "Высокий"
                          ? "bg-red-100 text-red-600"
                          : recommendation.priority === "Средний"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1 text-base">{recommendation.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{recommendation.description}</p>
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-xl border border-primary text-primary hover:bg-primary/10 transition px-4 py-2 text-sm font-semibold mt-2"
                        size="sm"
                      >
                        <Link to={recommendation.link || '/services'}>Подробнее</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </MainLayout>
  );
}

export default Dashboard;