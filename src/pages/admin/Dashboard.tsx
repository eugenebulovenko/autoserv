import { useEffect, useState } from 'react';
import { getRuStatusText } from "../../utils/statusUtils";
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from "@/lib/utils";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
}

interface Appointment {
  id: string;
  vehicle_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  notes: string;
  work_order_id: string;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    year: number;
    vin?: string;
    license_plate?: string;
  };
}

interface ServiceHistory {
  id: string;
  vehicle_id: string;
  service_date: string;
  service_type: string;
  description: string;
  cost: number;
  status: string;
  vehicles?: {
    id: string;
    make: string;
    model: string;
    year: number;
    vin?: string;
    license_plate?: string;
  };
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface WorkOrder {
  id: string;
  status: string;
  total_cost: number;
  created_at: string;
  mechanic?: {
    first_name: string;
    last_name: string;
  };
}

interface DashboardData {
  recentWorkOrders: WorkOrder[];
  totalAmount: number;
  statusCounts: Record<string, number>;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Цветные бейджи для статусов
  const statusBadge = (status: string) => {
    const base = "px-2 py-1 rounded-full text-xs font-semibold inline-block";
    switch (status) {
      case 'confirmed':
        return <span className={`${base} bg-blue-100 text-blue-800`}>Подтверждена</span>;
      case 'in_progress':
        return <span className={`${base} bg-yellow-100 text-yellow-800`}>В работе</span>;
      case 'completed':
        return <span className={`${base} bg-green-100 text-green-800`}>Завершена</span>;
      case 'cancelled':
        return <span className={`${base} bg-red-100 text-red-800`}>Отменена</span>;
      default:
        return <span className={`${base} bg-gray-100 text-gray-800`}>{getRuStatusText(status)}</span>;
    }
  };

  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([]);
  const [recommendedServices, setRecommendedServices] = useState<Service[]>([]);
  const [activeOrders, setActiveOrders] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [data, setData] = useState<DashboardData>({
    recentWorkOrders: [],
    totalAmount: 0,
    statusCounts: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Автомобили
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*');
      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);

      // 2. Все записи (appointments) с профилем пользователя и авто
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`*, profiles:user_id (id, first_name, last_name, phone), vehicles:vehicle_id (id, make, model, year, vin, license_plate)`);
      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

      // 3. История обслуживания c авто
      const { data: historyData, error: historyError } = await supabase
        .from('service_history')
        .select('*, vehicles:vehicle_id (id, make, model, year, vin, license_plate)')
        .order('service_date', { ascending: false });
      if (historyError) throw historyError;
      setServiceHistory(historyData || []);

      // 4. Рекомендуемые услуги (top-5)
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .limit(5);
      if (servicesError) throw servicesError;
      setRecommendedServices(servicesData || []);

      // 5. Активные заказы (appointments confirmed/in_progress, дата >= сегодня) с авто
      const today = new Date().toISOString().slice(0, 10);
      const { data: activeOrdersData, error: activeOrdersError } = await supabase
        .from('appointments')
        .select('*, vehicles:vehicle_id (id, make, model, year, vin, license_plate)')
        .in('status', ['confirmed', 'in_progress'])
        .gte('appointment_date', today);
      if (activeOrdersError) throw activeOrdersError;
      setActiveOrders(activeOrdersData || []);

      // 6. Предстоящие записи (appointments с датой > сегодня и не completed) с авто
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('appointments')
        .select('*, vehicles:vehicle_id (id, make, model, year, vin, license_plate)')
        .gt('appointment_date', today)
        .not('status', 'eq', 'completed');
      if (upcomingError) throw upcomingError;
      setUpcomingAppointments(upcomingData || []);

      // 7. Последние заказ-наряды c механиком
      const { data: recentOrders, error: recentOrdersError } = await supabase
        .from('work_orders')
        .select(`id, status, total_cost, created_at, mechanic:profiles!work_orders_mechanic_id_fkey (first_name, last_name)`) // можно добавить order_number если есть
        .order('created_at', { ascending: false })
        .limit(5);
      if (recentOrdersError) throw recentOrdersError;

      // 8. Общая сумма
      const { data: totalAmountData, error: totalAmountError } = await supabase
        .from('work_orders')
        .select('total_cost')
        .not('total_cost', 'is', null);
      if (totalAmountError) throw totalAmountError;

      // 9. Количество заказ-нарядов по статусам
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('work_orders')
        .select('status');
      if (allOrdersError) throw allOrdersError;

      const totalAmount = totalAmountData.reduce((sum, order) => sum + (order.total_cost || 0), 0);
      const statusCounts = allOrders.reduce((acc: Record<string, number>, { status }: { status: string }) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      setData({
        recentWorkOrders: recentOrders,
        totalAmount,
        statusCounts
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Не удалось загрузить данные дашборда');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0a2 2 0 01-2-2v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0V7a2 2 0 012-2h2a2 2 0 012 2v10m6 0a2 2 0 002-2v-5a2 2 0 00-2-2h-2a2 2 0 00-2 2v5" /></svg>
        Панель управления
      </h1>

      {/* Метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-300 text-white rounded-xl shadow p-6 flex flex-col items-start">
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v-2a4 4 0 014-4h10a4 4 0 014 4v2" /></svg>
            <span className="uppercase text-xs tracking-wider">Автомобили</span>
          </div>
          <div className="text-3xl font-bold">{vehicles.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-300 text-white rounded-xl shadow p-6 flex flex-col items-start">
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4 4 4-4m0-5V3m-8 9V3m8 0v2a2 2 0 01-2 2H6a2 2 0 01-2-2V3" /></svg>
            <span className="uppercase text-xs tracking-wider">Записи</span>
          </div>
          <div className="text-3xl font-bold">{appointments.length}</div>
        </div>
      </div>

      {/* Секции */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Автомобили */}
        <section className="bg-white rounded-xl shadow p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v-2a4 4 0 014-4h10a4 4 0 014 4v2" /></svg>
            Автомобили
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2">Марка</th>
                  <th className="px-2 py-2">Модель</th>
                  <th className="px-2 py-2">Год</th>
                  <th className="px-2 py-2">VIN</th>
                  <th className="px-2 py-2">Госномер</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-blue-50 transition">
                    <td className="px-2 py-1">{v.make}</td>
                    <td className="px-2 py-1">{v.model}</td>
                    <td className="px-2 py-1">{v.year}</td>
                    <td className="px-2 py-1">{v.vin}</td>
                    <td className="px-2 py-1">{v.license_plate || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Все записи (appointments) */}
        <section className="bg-white rounded-xl shadow p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4 4 4-4m0-5V3m-8 9V3m8 0v2a2 2 0 01-2 2H6a2 2 0 01-2-2V3" /></svg>
            Записи
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {appointments.map((a) => (
  <tr key={a.id} className="hover:bg-green-50 transition">
    <td className="px-2 py-1">{a.appointment_date}</td>
    <td className="px-2 py-1">{a.start_time} - {a.end_time}</td>
    <td className="px-2 py-1 flex items-center gap-2">
      {statusBadge(a.status)}
      {a.status === 'pending' && (
        <button
          className="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs"
          onClick={async () => {
            try {
              const { error } = await supabase
                .from('appointments')
                .update({ status: 'confirmed', updated_at: new Date().toISOString() })
                .eq('id', a.id);
              if (error) throw error;
              // Обновляем список
              fetchDashboardData();
            } catch (err) {
              alert('Ошибка при подтверждении записи');
            }
          }}
        >
          Подтвердить
        </button>
      )}
    </td>
    <td className="px-2 py-1">{formatCurrency(a.total_price)}</td>
    <td className="px-2 py-1">{a.vehicle ? `${a.vehicle.make} ${a.vehicle.model} ${a.vehicle.year}` : '-'}</td>
  </tr>
))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* История обслуживания */}
      <section className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          История обслуживания
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2">Дата</th>
                <th className="px-2 py-2">Тип услуги</th>
                <th className="px-2 py-2">Описание</th>
                <th className="px-2 py-2">Стоимость</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2">Авто</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {serviceHistory.map((h) => (
                <tr key={h.id} className="hover:bg-indigo-50 transition">
                  <td className="px-2 py-1">{h.service_date ? new Date(h.service_date).toLocaleDateString() : '-'}</td>
                  <td className="px-2 py-1">{h.service_type}</td>
                  <td className="px-2 py-1">{h.description}</td>
                  <td className="px-2 py-1 font-bold text-indigo-700">{formatCurrency(h.cost)}</td>
                  <td className="px-2 py-1">{statusBadge(h.status)}</td>
                  <td className="px-2 py-1">{h.vehicles ? `${h.vehicles.make} ${h.vehicles.model} ${h.vehicles.year}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Рекомендуемые услуги */}
      <section className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m4 4v-6a2 2 0 00-2-2H7a2 2 0 00-2 2v6" /></svg>
          Рекомендуемые услуги
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedServices.map((s) => (
            <div key={s.id} className="rounded-xl p-4 bg-gradient-to-tr from-pink-100 to-pink-50 shadow hover:shadow-lg transition flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2" /></svg>
                <h3 className="font-semibold text-pink-700">{s.name}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">{s.description}</p>
              <div className="font-bold text-lg text-pink-700">{formatCurrency(s.price)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Активные заказы */}
      <section className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v4a1 1 0 001 1h3v2a1 1 0 001 1h2a1 1 0 001-1v-2h3a1 1 0 001-1V7" /></svg>
          Активные заказы
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {activeOrders.map((a) => (
                <tr key={a.id} className="hover:bg-yellow-50 transition">
                  <td className="px-2 py-1">{a.appointment_date}</td>
                  <td className="px-2 py-1">{a.start_time} - {a.end_time}</td>
                  <td className="px-2 py-1">{statusBadge(a.status)}</td>
                  <td className="px-2 py-1 font-bold text-yellow-700">{formatCurrency(a.total_price)}</td>
                  <td className="px-2 py-1">{a.vehicle ? `${a.vehicle.make} ${a.vehicle.model} ${a.vehicle.year}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Предстоящие записи */}
      <section className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" /></svg>
          Предстоящие записи
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {upcomingAppointments.map((a) => (
                <tr key={a.id} className="hover:bg-blue-50 transition">
                  <td className="px-2 py-1">{a.appointment_date}</td>
                  <td className="px-2 py-1">{a.start_time} - {a.end_time}</td>
                  <td className="px-2 py-1">{statusBadge(a.status)}</td>
                  <td className="px-2 py-1 font-bold text-blue-700">{formatCurrency(a.total_price)}</td>
                  <td className="px-2 py-1">{a.vehicle ? `${a.vehicle.make} ${a.vehicle.model} ${a.vehicle.year}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Последние заказ-наряды */}
      <section className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2" /></svg>
          Последние заказ-наряды
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2">Номер</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2">Механик</th>
                <th className="px-2 py-2">Сумма</th>
                <th className="px-2 py-2">Дата</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {data.recentWorkOrders.map((order) => (
                <tr key={order.id} className="hover:bg-green-50 transition">
                  <td className="px-2 py-1">{order.id}</td>
                  <td className="px-2 py-1">{statusBadge(order.status)}</td>
                  <td className="px-2 py-1">{order.mechanic ? `${order.mechanic.first_name} ${order.mechanic.last_name}` : 'Не назначен'}</td>
                  <td className="px-2 py-1 font-bold text-green-700">{formatCurrency(order.total_cost)}</td>
                  <td className="px-2 py-1">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Общая сумма */}
      <section className="bg-white p-6 rounded-lg shadow-xl flex items-center gap-4">
        <div className="flex items-center justify-center bg-gradient-to-tr from-purple-200 to-purple-50 rounded-full h-16 w-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4m8-4h-4m-8 0H4" /></svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-1">Общая сумма</h2>
          <p className="text-2xl font-bold text-purple-700">{formatCurrency(data.totalAmount)}</p>
        </div>
      </section>

      {/* Количество заказ-нарядов по статусам */}
      <section className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v-2a4 4 0 014-4h10a4 4 0 014 4v2" /></svg>
          Количество заказ-нарядов по статусам
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(data.statusCounts).map((status) => (
            <div key={getRuStatusText(status)} className="rounded-xl p-4 bg-gradient-to-tr from-cyan-100 to-cyan-50 shadow flex flex-col items-center">
              <span className="mb-2">{statusBadge(status)}</span>
              <span className="text-2xl font-bold text-cyan-700">{data.statusCounts[status]}</span>
            </div>
          ))}
        </div>
      </section>


      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Рекомендуемые услуги</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedServices.map((s) => (
            <div key={s.id} className="border rounded p-4">
              <h3 className="font-semibold">{s.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{s.description}</p>
              <div className="font-bold">{formatCurrency(s.price)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Активные заказы */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Активные заказы</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Время</th>
                <th>Статус</th>
                <th>Цена</th>
                <th>Авто</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map((a) => (
  <tr key={a.id}>
    <td>{a.appointment_date}</td>
    <td>{a.start_time} - {a.end_time}</td>
    <td>{statusBadge(a.status)}</td>
    <td>{formatCurrency(a.total_price)}</td>
    <td>{a.vehicle && `${a.vehicle.make} ${a.vehicle.model} ${a.vehicle.year}`}</td>
    <td>
      <button
        className="text-blue-600 hover:underline mr-2"
        onClick={() => navigate(`/admin/appointments/${a.id}`)}
      >
        Подробнее
      </button>
    </td>
  </tr>
))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Предстоящие записи */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Предстоящие записи</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Время</th>
                <th>Статус</th>
                <th>Цена</th>
                <th>Авто</th>
              </tr>
            </thead>
            <tbody>
              {upcomingAppointments.map((a) => (
  <tr key={a.id}>
    <td>{a.appointment_date}</td>
    <td>{a.start_time} - {a.end_time}</td>
    <td>{statusBadge(a.status)}</td>
    <td>{formatCurrency(a.total_price)}</td>
    <td>{a.vehicle && `${a.vehicle.make} ${a.vehicle.model} ${a.vehicle.year}`}</td>
    <td>
      <button
        className="text-blue-600 hover:underline mr-2"
        onClick={() => navigate(`/admin/appointments/${a.id}`)}
      >
        Подробнее
      </button>
    </td>
  </tr>
))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Последние заказ-наряды */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Последние заказ-наряды</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Номер</th>
                <th>Статус</th>
                <th>Механик</th>
                <th>Сумма</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {data.recentWorkOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{statusBadge(order.status)}</td>
                  <td>
                    {order.mechanic ? `${order.mechanic.first_name} ${order.mechanic.last_name}` : 'Не назначен'}
                  </td>
                  <td>{formatCurrency(order.total_cost)}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Общая сумма */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Общая сумма</h2>
        <p className="text-2xl font-bold">{formatCurrency(data.totalAmount)}</p>
      </section>

      {/* Количество заказ-нарядов по статусам */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Количество заказ-нарядов по статусам</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(data.statusCounts).map((status) => (
            <div key={getRuStatusText(status)} className="border rounded p-4">
              <h3 className="font-semibold">{getRuStatusText(status)}</h3>
              <p className="text-sm text-gray-600 mb-2">{data.statusCounts[status]}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;