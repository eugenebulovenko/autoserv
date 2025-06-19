import { useEffect, useState } from "react";

import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Calendar, Users, ClipboardList, Wrench, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "../../utils/dateUtils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Loader2 } from "lucide-react";

interface Stats {
  clients: number;
  appointments: number;
  workOrders: number;
  mechanics: number;
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  status: string;
  profiles: {
    first_name: string;
    last_name: string;
    phone: string | null;
  };
  vehicles: {
    make: string;
    model: string;
    year: number;
  };
}

const AdminHome = () => {
  const [stats, setStats] = useState<Stats>({
    clients: 0,
    appointments: 0,
    workOrders: 0,
    mechanics: 0,
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Получаем количество клиентов
      const { count: clientsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'client');

      // Получаем количество записей
      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      // Получаем количество заказ-нарядов
      const { count: workOrdersCount } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true });

      // Получаем количество механиков
      const { count: mechanicsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'mechanic');

      setStats({
        clients: clientsCount || 0,
        appointments: appointmentsCount || 0,
        workOrders: workOrdersCount || 0,
        mechanics: mechanicsCount || 0,
      });
    } catch (error) {
      console.error("Ошибка при загрузке статистики:", error);
      toast.error("Не удалось загрузить статистику");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`*,profiles (first_name,last_name,phone),vehicles (make,model,year)`)
        .eq("status", "pending")
        .order("appointment_date", { ascending: true })
        .limit(5);
      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Ошибка при загрузке записей:", error);
      toast.error("Не удалось загрузить записи");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAppointments();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Панель управления</h1>
        <p className="text-muted-foreground">
          Обзор основных показателей и действий
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="mr-2 h-4 w-4 text-primary" />
              Клиенты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.clients}</div>
            <p className="text-muted-foreground text-sm">
              Зарегистрированных клиентов
            </p>
            <Button variant="ghost" size="sm" asChild className="mt-2 h-7 px-2 text-xs">
              <Link to="/admin/clients">Подробнее</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-primary" />
              Записи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.appointments}</div>
            <p className="text-muted-foreground text-sm">
              Ожидающих подтверждения
            </p>
            <Button variant="ghost" size="sm" asChild className="mt-2 h-7 px-2 text-xs">
              <Link to="/admin/appointments">Подробнее</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ClipboardList className="mr-2 h-4 w-4 text-primary" />
              Заказ-наряды
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.workOrders}</div>
            <p className="text-muted-foreground text-sm">
              Оформленных заказ-нарядов
            </p>
            <Button variant="ghost" size="sm" asChild className="mt-2 h-7 px-2 text-xs">
              <Link to="/admin/work-orders">Подробнее</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wrench className="mr-2 h-4 w-4 text-primary" />
              Механики
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.mechanics}</div>
            <p className="text-muted-foreground text-sm">
              Механиков в системе
            </p>
            <Button variant="ghost" size="sm" asChild className="mt-2 h-7 px-2 text-xs">
              <Link to="/admin/mechanics">Подробнее</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Calendar className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">Записи</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Управление записями клиентов, подтверждение и отмена записей
                </p>
                <Button asChild>
                  <Link to="/admin/appointments">Управлять записями</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <ClipboardList className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">Заказ-наряды</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Создание и редактирование заказ-нарядов, назначение механиков
                </p>
                <Button asChild>
                  <Link to="/admin/work-orders">Управлять заказ-нарядами</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">Статистика</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Отчеты и статистика по работе автосервиса, аналитика
                </p>
                <Button asChild>
                  <Link to="/admin/reports">Просмотреть отчеты</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Предстоящие записи</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Ожидающие подтверждения</span>
              <Button variant="ghost" size="sm" className="text-xs h-7">
                Все записи
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : appointments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Автомобиль</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Время</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div>
                          <div>
                            {appointment.profiles.first_name}{" "}
                            {appointment.profiles.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.profiles.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>
                            {appointment.vehicles.make}{" "}
                            {appointment.vehicles.model}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.vehicles.year} г.в.
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                      <TableCell>{appointment.start_time}</TableCell>
                      <TableCell className="text-right">
                        <Button
  variant="ghost"
  size="sm"
  onClick={async () => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', appointment.id);
      if (error) throw error;
      toast.success('Запись подтверждена');
      fetchAppointments();
    } catch (err) {
      toast.error('Ошибка при подтверждении записи');
    }
  }}
>
  Подтвердить
</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Нет ожидающих подтверждения записей
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHome;
