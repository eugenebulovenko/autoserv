import { useState, useEffect } from "react";
import { getRuStatusText } from "../../utils/statusUtils";
import { supabase } from "../../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Calendar, Clock, User, Car, CheckCircle, XCircle, Loader2, MoreHorizontal, Edit, ClipboardList, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { formatDate, formatTime } from "../../utils/dateUtils";
import { Label } from "../../components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Textarea } from "../../components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  notes: string | null;
  user_id: string;
  vehicle_id: string;
  work_order_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null;
  vehicles: {
    id: string;
    make: string;
    model: string;
    year: number;
    vin: string | null;
  } | null;
  work_orders: {
    id: string;
    order_number: string;
    status: string;
    mechanic_id: string | null;
  } | null;
}

interface Mechanic {
  id: string;
  first_name: string;
  last_name: string;
}

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedMechanic, setSelectedMechanic] = useState<string>("");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchMechanics();
  }, []);

  const fetchMechanics = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'mechanic');

      if (error) throw error;
      setMechanics(data || []);
    } catch (error) {
      console.error('Error fetching mechanics:', error);
      toast.error('Ошибка при загрузке списка механиков');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Подтверждено';
      case 'cancelled':
        return 'Отменено';
      case 'pending':
        return 'Ожидает подтверждения';
      default:
        return status;
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles:user_id (
            id,
            first_name,
            last_name,
            phone
          ),
          vehicles:vehicle_id (
            id,
            make,
            model,
            year,
            vin
          ),
          work_orders!work_order_id (
            id,
            order_number,
            status
          )
        `)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      
      console.log('Fetched appointments:', data);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Ошибка при загрузке записей');
      toast.error('Ошибка при загрузке записей');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('Статус записи обновлен');
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Не удалось обновить статус записи');
    }
  };

  const handleConfirmAppointment = async (appointment: Appointment) => {
    try {
      // Обновляем статус записи на confirmed
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment.id);

      if (error) throw error;

      toast.success('Запись подтверждена');
      fetchAppointments();
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast.error('Ошибка при подтверждении записи');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      // Обновляем статус записи
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (appointmentError) throw appointmentError;

      // Если есть связанный заказ-наряд, обновляем его статус
      const { data: appointment } = await supabase
        .from('appointments')
        .select('work_order_id')
        .eq('id', appointmentId)
        .single();

      if (appointment?.work_order_id) {
        const { error: workOrderError } = await supabase
          .from('work_orders')
          .update({ status: 'cancelled' })
          .eq('id', appointment.work_order_id);

        if (workOrderError) throw workOrderError;
      }

      toast.success('Запись отменена');
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Не удалось отменить запись');
    }
  };

  const handleOpenEditDialog = (appointment: Appointment) => {
    setEditAppointment(appointment);
    setAppointmentDate(appointment.appointment_date);
    setStartTime(appointment.start_time);
    setEndTime(appointment.end_time);
    setStatus(appointment.status);
    setTotalPrice(appointment.total_price);
    setNotes(appointment.notes || "");
    setSelectedVehicle(appointment.vehicle_id);
    setSelectedMechanic(appointment.work_orders?.mechanic_id || "");
    setOpen(true);
  };

  const handleSaveAppointment = async () => {
    if (!editAppointment) return;

    try {
      // Обновляем запись
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          appointment_date: appointmentDate,
          start_time: startTime,
          end_time: endTime,
          status,
          total_price: totalPrice,
          notes,
          vehicle_id: selectedVehicle,
          updated_at: new Date().toISOString()
        })
        .eq('id', editAppointment.id);

      if (updateError) throw updateError;

      // Если есть заказ-наряд, обновляем его
      if (editAppointment.work_orders) {
        const { error: workOrderError } = await supabase
          .from('work_orders')
          .update({
            mechanic_id: selectedMechanic || null,
            status: selectedMechanic ? 'in_progress' : 'created',
            updated_at: new Date().toISOString()
          })
          .eq('id', editAppointment.work_orders.id);

        if (workOrderError) throw workOrderError;
      }

      toast.success('Запись успешно обновлена');
      setOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Ошибка при обновлении записи');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchAppointments}>Повторить попытку</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 md:py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Записи на сервис</h1>
        <p className="text-muted-foreground">
          Управление записями клиентов на сервисное обслуживание
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список записей</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Поиск по клиенту или автомобилю..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Автомобиль</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Стоимость</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : appointments.length > 0 ? (
                  appointments
                    .filter((appointment) => {
                      const searchLower = search.toLowerCase();
                      return (
                        appointment.profiles?.first_name.toLowerCase().includes(searchLower) ||
                        appointment.profiles?.last_name.toLowerCase().includes(searchLower) ||
                        appointment.vehicles?.make.toLowerCase().includes(searchLower) ||
                        appointment.vehicles?.model.toLowerCase().includes(searchLower)
                      );
                    })
                    .map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div>
                            <div>
                              {appointment.profiles?.first_name} {appointment.profiles?.last_name}
                            </div>
                            {appointment.profiles?.phone && (
                              <div className="text-sm text-muted-foreground">
                                {appointment.profiles.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>
                              {appointment.vehicles?.make} {appointment.vehicles?.model}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.vehicles?.year} г.в. • VIN:{" "}
                              {appointment.vehicles?.vin}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                        <TableCell>
                          {formatTime(appointment.start_time)} -{" "}
                          {formatTime(appointment.end_time)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(appointment.total_price)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                appointment.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : appointment.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {getRuStatusText(appointment.status)}
                            </span>
                            {appointment.work_orders && (
                              <div className="text-xs text-muted-foreground">
                                Заказ-наряд: {appointment.work_orders.order_number}
                                <span className={`ml-2 ${
                                  appointment.work_orders.status === "completed"
                                    ? "text-green-600"
                                    : appointment.work_orders.status === "in_progress"
                                    ? "text-blue-600"
                                    : "text-gray-600"
                                }`}>
                                  {getRuStatusText(appointment.work_orders.status)}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Открыть меню</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Действия</DropdownMenuLabel>
                              {getRuStatusText(appointment.status) === "pending" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleConfirmAppointment(appointment)}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Подтвердить
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleCancelAppointment(appointment.id)}
                                    className="text-red-600"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Отменить
                                  </DropdownMenuItem>
                                </>
                              )}
                              {getRuStatusText(appointment.status) === "confirmed" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(appointment.id, "completed")}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Завершить
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleOpenEditDialog(appointment)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Редактировать
                              </DropdownMenuItem>
                              {appointment.work_orders?.id && (
                                <DropdownMenuItem
                                  onClick={() => navigate(`/admin/work-orders/${appointment.work_orders?.id}`)}
                                >
                                  <ClipboardList className="mr-2 h-4 w-4" />
                                  Просмотр заказ-наряда
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      <p className="text-muted-foreground">
                        Нет записей для отображения
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Диалог редактирования записи */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редактировать запись</DialogTitle>
            <DialogDescription>
              Внесите изменения в запись
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Дата
              </Label>
              <Input
                id="date"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Время начала
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                Время окончания
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Статус
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Ожидает подтверждения</SelectItem>
                  <SelectItem value="confirmed">Подтверждена</SelectItem>
                  <SelectItem value="completed">Завершена</SelectItem>
                  <SelectItem value="cancelled">Отменена</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalPrice" className="text-right">
                Стоимость
              </Label>
              <Input
                id="totalPrice"
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Примечания
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mechanic" className="text-right">
                Механик
              </Label>
              <Select value={selectedMechanic} onValueChange={setSelectedMechanic}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Выберите механика" />
                </SelectTrigger>
                <SelectContent>
                  {mechanics.map((mechanic) => (
                    <SelectItem key={mechanic.id} value={mechanic.id}>
                      {mechanic.first_name} {mechanic.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              onClick={handleSaveAppointment}
            >
              Сохранить изменения
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAppointments;