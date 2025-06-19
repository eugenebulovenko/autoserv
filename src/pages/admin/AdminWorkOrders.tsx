import { useState, useEffect, useRef } from "react";
import QualityCheckDialog from "../../components/admin/QualityCheckDialog";
import { getRuStatusText } from "../../utils/statusUtils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Plus, Printer, MoreHorizontal, Pencil, Eye, Download, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { clientService } from '@/services/clientService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WorkOrderServicesEditor from "@/components/admin/WorkOrderServicesEditor";
import { formatCurrency } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

// Интерфейс для сервиса
interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

// Интерфейс для связи заказ-наряда с услугами
interface WorkOrderService {
  id?: string;
  work_order_id: string;
  service_id: string;
  price: number;
  quantity: number;
  services?: Service;
  isNew?: boolean;
  isDeleted?: boolean;
  priceManuallySet?: boolean;
}

// Updated interface to match the database schema
interface WorkOrder {
  id: string;
  order_number: string;
  appointment_id: string;
  client_id: string;
  mechanic_id: string | null;
  status: 'created' | 'in_progress' | 'completed' | 'cancelled';
  total_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  start_date?: string;
  completion_date?: string;
  appointments: {
    id: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: string;
    total_price: number | null;
    notes: string | null;
    vehicle_id: string;
    user_id: string;
    profiles: {
      id: string;
      first_name: string;
      last_name: string;
      phone: string;
      email: string;
      full_name?: string;
    };
    vehicles: {
      id: string;
      make: string;
      model: string;
      year: number;
      license_plate: string;
      vin?: string;
    };
  };
  mechanic: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    full_name?: string;
  } | null;
  work_order_services?: {
    id: string;
    service_id: string;
    price: number;
    services: {
      id: string;
      name: string;
      description: string;
    };
  }[];
}

// Добавляем утилиты напрямую в файл, так как они не найдены
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Не указана';
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (timeString: string | undefined | null): string => {
  if (!timeString) return 'Не указано';
  return timeString.substring(0, 5);
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'created':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'parts_waiting':
      return 'bg-orange-100 text-orange-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'quality_passed':
      return 'bg-purple-100 text-purple-800';
    case 'quality_issues':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'created':
      return 'Создан';
    case 'in_progress':
      return 'В работе';
    case 'parts_waiting':
      return 'Ожидает запчастей';
    case 'completed':
      return 'Завершен';
    case 'quality_passed':
      return 'Проверка пройдена';
    case 'quality_issues':
      return 'Есть проблемы';
    default:
      return status;
  }
};

const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'created':
      return "default";
    case 'in_progress':
      return "secondary";
    case 'parts_waiting':
      return "destructive";
    case 'completed':
      return "default";
    case 'quality_passed':
      return "default";
    case 'quality_issues':
      return "destructive";
    default:
      return "default";
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'created':
      return "Создан";
    case 'in_progress':
      return "В работе";
    case 'parts_waiting':
      return "Ожидает запчастей";
    case 'completed':
      return "Завершен";
    case 'quality_passed':
      return "Проверка пройдена";
    case 'quality_issues':
      return "Есть проблемы";
    default:
      return status;
  }
};

const AdminWorkOrders = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editWorkOrder, setEditWorkOrder] = useState<WorkOrder | null>(null);
  const [workOrderServices, setWorkOrderServices] = useState<WorkOrderService[]>([]);
  const [servicesChanged, setServicesChanged] = useState(false);
  const { toast } = useToast();
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string; }[]>([]);
  const [mechanics, setMechanics] = useState<{ id: string; first_name: string; last_name: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form state for creating/editing work orders
  const [orderNumber, setOrderNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>("medium");
  const [clientId, setClientId] = useState("");
  const [mechanicId, setMechanicId] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [isWarranty, setIsWarranty] = useState(false);
  const [isQualityCheckDialogOpen, setIsQualityCheckDialogOpen] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleCheckboxChange = (checked: boolean) => {
    setIsWarranty(checked);
  };

  useEffect(() => {
    fetchWorkOrders();
    fetchClients();
    fetchMechanics();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      // Fetch active work orders
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
          ),
          work_order_services (
            id,
            service_id,
            price,
            quantity,
            services (
              id,
              name,
              description,
              price
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      setWorkOrders(activeData || []);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заказ-наряды",
        variant: "destructive",
      });
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'client');

      if (error) {
        console.error("Error fetching clients:", error);
        toast({
          title: "Error",
          description: "Failed to fetch clients.",
          variant: "destructive",
        });
      }

      if (data) {
        setClients(data);
      }
    } catch (error) {
      console.error("Unexpected error fetching clients:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching clients.",
        variant: "destructive",
      });
    }
  };

  const fetchMechanics = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'mechanic');

      if (error) {
        console.error("Error fetching mechanics:", error);
        toast({
          title: "Error",
          description: "Failed to fetch mechanics.",
          variant: "destructive",
        });
      }

      if (data) {
        setMechanics(data);
      }
    } catch (error) {
      console.error("Unexpected error fetching mechanics:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching mechanics.",
        variant: "destructive",
      });
    }
  };

  const createWorkOrder = async () => {
    try {
      const generatedOrderNumber = `WO-${Date.now().toString().slice(-6)}`;
      
      const { error } = await supabase
        .from('work_orders')
        .insert({
          order_number: generatedOrderNumber,
          status: status,
          mechanic_id: mechanicId,
          client_id: clientId,
          total_cost: totalCost,
          start_date: startDate || null,
          completion_date: completionDate || null,
        });

      if (error) {
        console.error("Error creating work order:", error);
        toast({
          title: "Error",
          description: "Failed to create work order.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Work order created successfully.",
      });
      setOpen(false);
      fetchWorkOrders();
      clearForm();
    } catch (error) {
      console.error("Unexpected error creating work order:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the work order.",
        variant: "destructive",
      });
    }
  };

  const updateWorkOrder = async () => {
    if (!editWorkOrder) return;

    try {
      const updateData: any = {
        status: status,
        mechanic_id: mechanicId,
        total_cost: totalCost
      };

      // Добавляем даты только если они есть
      if (startDate) {
        updateData.start_date = startDate;
      }
      if (completionDate) {
        updateData.completion_date = completionDate;
      } else if (status === 'completed') {
        updateData.completion_date = new Date().toISOString().split('T')[0];
      }

      // Обновляем основную информацию заказ-наряда
      const { error } = await supabase
        .from('work_orders')
        .update(updateData)
        .eq('id', editWorkOrder.id);

      if (error) {
        console.error("Error updating work order:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось обновить заказ-наряд",
          variant: "destructive",
        });
        return;
      }

      // Если были изменения в услугах, обновляем их
      if (servicesChanged) {
        // Сначала удаляем все существующие услуги для этого заказ-наряда
        const { error: deleteError } = await supabase
          .from('work_order_services')
          .delete()
          .eq('work_order_id', editWorkOrder.id);

        if (deleteError) {
          console.error("Error deleting work order services:", deleteError);
          toast({
            title: "Ошибка",
            description: "Не удалось обновить услуги заказ-наряда",
            variant: "destructive",
          });
          return;
        }

        // Затем добавляем новые услуги
        const activeServices = workOrderServices.filter(s => !s.isDeleted);
        
        if (activeServices.length > 0) {
          const servicesToInsert = activeServices.map(service => ({
            work_order_id: editWorkOrder.id,
            service_id: service.service_id || service.services?.id,
            price: service.price,
            quantity: service.quantity || 1
          }));

          const { error: insertError } = await supabase
            .from('work_order_services')
            .insert(servicesToInsert);

          if (insertError) {
            console.error("Error inserting work order services:", insertError);
            toast({
              title: "Ошибка",
              description: "Не удалось добавить услуги заказ-наряда",
              variant: "destructive",
            });
            return;
          }
        }
      }

      toast({
        title: "Успех",
        description: "Заказ-наряд успешно обновлен",
      });
      setOpen(false);
      fetchWorkOrders();
      clearForm();
    } catch (error) {
      console.error("Unexpected error updating work order:", error);
      toast({
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка при обновлении заказ-наряда",
        variant: "destructive",
      });
    }
  };

  const deleteWorkOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting work order:", error);
        toast({
          title: "Error",
          description: "Failed to delete work order.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Work order deleted successfully.",
      });
      fetchWorkOrders();
    } catch (error) {
      console.error("Unexpected error deleting work order:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the work order.",
        variant: "destructive",
      });
    }
  };

  const clearForm = () => {
    setOrderNumber("");
    setStatus("created");
    setMechanicId(null);
    setTotalCost(0);
    setStartDate("");
    setCompletionDate("");
    setWorkOrderServices([]);
    setServicesChanged(false);
    setEditWorkOrder(null);
  };

  const filteredWorkOrders = workOrders.filter((workOrder) => {
    const searchLower = search.toLowerCase();
    const clientFirstName = workOrder.appointments?.profiles?.first_name?.toLowerCase() || '';
    const clientLastName = workOrder.appointments?.profiles?.last_name?.toLowerCase() || '';
    const orderNumber = workOrder.order_number?.toLowerCase() || '';
    
    return (
      orderNumber.includes(searchLower) ||
      clientFirstName.includes(searchLower) ||
      clientLastName.includes(searchLower)
    );
  });

  const handleOpenEditDialog = async (workOrder: WorkOrder) => {
    setEditWorkOrder(workOrder);
    setOrderNumber(workOrder.order_number);
    setStatus(workOrder.status);
    setMechanicId(workOrder.mechanic_id);
    setTotalCost(workOrder.total_cost || 0);
    setStartDate(workOrder.start_date || "");
    setCompletionDate(workOrder.completion_date || "");
    setServicesChanged(false);
    
    // Загружаем услуги для заказ-наряда
    try {
      const { data, error } = await supabase
        .from('work_order_services')
        .select(`
          *,
          services (
            id,
            name,
            description,
            price
          )
        `)
        .eq('work_order_id', workOrder.id);

      if (error) throw error;
      
      setWorkOrderServices(data || []);
    } catch (error) {
      console.error('Ошибка при загрузке услуг заказ-наряда:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить услуги заказ-наряда",
        variant: "destructive"
      });
    }
    
    setOpen(true);
  };
  
  // Функция для обработки изменений в услугах
  const handleServicesChange = (services: any[], totalCost: number) => {
    setWorkOrderServices(services);
    setTotalCost(totalCost);
    setServicesChanged(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
  try {
    // 1. Update the work order status
    const { error } = await supabase
      .from('work_orders')
      .update({ 
        status: newStatus,
        ...(newStatus === 'completed' ? { completion_date: new Date().toISOString() } : {})
      })
      .eq('id', orderId);

    if (error) throw error;

    // 2. If completed, add service history
    if (newStatus === 'completed') {
      // Find the work order details
      const workOrder = workOrders.find((wo) => wo.id === orderId);
      if (workOrder && workOrder.appointments?.vehicles) {
        const vehicle = workOrder.appointments.vehicles;
        const serviceType = workOrder.notes || 'Техническое обслуживание';
        const description = `Работа по заказ-наряду №${workOrder.order_number}`;
        const cost = workOrder.total_cost || 0;
        const serviceDate = new Date().toISOString().split('T')[0]; // Use current time as per user instruction
        // Check if a similar service history already exists (by vehicleId and date)
        try {
          const { data: existingHistory, error: historyError } = await supabase
            .from('service_history')
            .select('*')
            .eq('vehicle_id', vehicle.id)
            .eq('service_date', workOrder.completion_date ? workOrder.completion_date.split('T')[0] : serviceDate.split('T')[0]);
          if (historyError) throw historyError;
          if (!existingHistory || existingHistory.length === 0) {
            await supabase.from('service_history').insert({
              vehicle_id: vehicle.id,
              service_date: serviceDate,
              service_type: serviceType,
              description,
              cost,
              status: 'completed',
            });
            toast({
              title: 'Успех',
              description: 'История обслуживания успешно добавлена'
            });
          } else {
            toast({
              title: 'Информация',
              description: 'Запись в истории обслуживания уже существует'
            });
          }
        } catch (e) {
          console.error('Ошибка добавления в историю обслуживания:', e);
          toast({
            title: 'Ошибка',
            description: 'Ошибка при добавлении в историю обслуживания',
            variant: 'destructive'
          });
        }
      }
    }
    fetchWorkOrders();
  } catch (error) {
    console.error('Error updating work order status:', error);
    toast({
      title: 'Ошибка',
      description: 'Не удалось обновить статус заказ-наряда',
      variant: 'destructive'
    });
  }
};

  const handleAssignMechanic = async (workOrderId: string, mechanicId: string) => {
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({ 
          mechanic_id: mechanicId,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', workOrderId);

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Механик назначен"
      });
      fetchWorkOrders();
    } catch (error) {
      console.error('Error assigning mechanic:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось назначить механика",
        variant: "destructive"
      });
    }
  };

  // Добавим функцию для печати
  const handlePrint = (order: WorkOrder) => {
    // Печать заказ-наряда
    setTimeout(() => {
      if (printRef.current) {
        // Создаем новое окно для печати
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast({
            title: "Ошибка",
            description: "Не удалось открыть окно печати. Проверьте настройки блокировки всплывающих окон.",
            variant: "destructive"
          });
          return;
        }
        
        // Добавляем стили и содержимое
        printWindow.document.write(`
          <html>
            <head>
              <title>Заказ-наряд №${order?.order_number}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { font-size: 18px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .info-block { margin-bottom: 15px; }
                .info-title { font-weight: bold; margin-bottom: 5px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Заказ-наряд №${order?.order_number}</h1>
                <div>Дата: ${new Date().toLocaleDateString()}</div>
              </div>
              
              <div class="info-block">
                <div class="info-title">Информация о клиенте:</div>
                <div>ФИО: ${order?.appointments?.profiles?.first_name || ''} ${order?.appointments?.profiles?.last_name || ''}</div>
                <div>Телефон: ${order?.appointments?.profiles?.phone || 'Не указан'}</div>
                <div>Email: ${order?.appointments?.profiles?.email || 'Не указан'}</div>
              </div>
              
              <div class="info-block">
                <div class="info-title">Информация об автомобиле:</div>
                <div>Марка/Модель: ${order?.appointments?.vehicles?.make || ''} ${order?.appointments?.vehicles?.model || ''}</div>
                <div>Год: ${order?.appointments?.vehicles?.year || 'Не указан'}</div>
                <div>Гос. номер: ${order?.appointments?.vehicles?.license_plate || 'Не указан'}</div>
                ${order?.appointments?.vehicles?.vin ? `<div>VIN: ${order?.appointments?.vehicles?.vin}</div>` : ''}
              </div>
              
              <div class="info-block">
                <div class="info-title">Выполненные работы:</div>
                <table>
                  <thead>
                    <tr>
                      <th>Услуга</th>
                      <th>Стоимость</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order?.work_order_services?.map((service: any) => `
                      <tr>
                        <td>${service.services?.name || 'Услуга'}</td>
                        <td>${formatCurrency(service.price)}</td>
                      </tr>
                    `).join('') || `
                      <tr>
                        <td colspan="2" style="text-align: center;">Нет данных об услугах</td>
                      </tr>
                    `}
                    <tr>
                      <td style="font-weight: bold;">Итого</td>
                      <td style="font-weight: bold;">${formatCurrency(order?.total_cost || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="info-block">
                <div class="info-title">Примечания:</div>
                <div>${order?.notes || 'Нет примечаний'}</div>
              </div>
              
              <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                <div>
                  <div style="margin-bottom: 30px;">Подпись механика: _________________</div>
                  <div>Механик: ${order?.mechanic?.first_name || ''} ${order?.mechanic?.last_name || ''}</div>
                </div>
                <div>
                  <div style="margin-bottom: 30px;">Подпись клиента: _________________</div>
                  <div>Дата: ${new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </body>
          </html>
        `);
        
        // Печатаем и закрываем окно
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          // printWindow.close();
        }, 500);
      }
    }, 100);
  };
  
  const handleDownloadPDF = async (order: WorkOrder) => {
    try {
      // Создаем новое окно для печати
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Ошибка",
          description: "Не удалось открыть окно для скачивания PDF. Проверьте настройки блокировки всплывающих окон.",
          variant: "destructive"
        });
        return;
      }
      
      // Добавляем стили и содержимое
      printWindow.document.write(`
        <html>
          <head>
            <title>Заказ-наряд №${order?.order_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { font-size: 18px; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .info-block { margin-bottom: 15px; }
              .info-title { font-weight: bold; margin-bottom: 5px; }
              #download-message { position: fixed; top: 0; left: 0; right: 0; background: #4CAF50; color: white; padding: 10px; text-align: center; }
            </style>
            <script>
              window.onload = function() {
                // Добавляем сообщение о том, как сохранить PDF
                var message = document.createElement('div');
                message.id = 'download-message';
                message.innerHTML = 'Для сохранения в PDF используйте функцию печати браузера и выберите "Сохранить как PDF"';
                document.body.insertBefore(message, document.body.firstChild);
                
                // Автоматически открываем диалог печати
                setTimeout(function() {
                  window.print();
                }, 1000);
              };
            </script>
          </head>
          <body>
            <div class="header">
              <h1>Заказ-наряд №${order?.order_number}</h1>
              <div>Дата: ${new Date().toLocaleDateString()}</div>
            </div>
            
            <div class="info-block">
              <div class="info-title">Информация о клиенте:</div>
              <div>ФИО: ${order?.appointments?.profiles?.first_name || ''} ${order?.appointments?.profiles?.last_name || ''}</div>
              <div>Телефон: ${order?.appointments?.profiles?.phone || 'Не указан'}</div>
              <div>Email: ${order?.appointments?.profiles?.email || 'Не указан'}</div>
            </div>
            
            <div class="info-block">
              <div class="info-title">Информация об автомобиле:</div>
              <div>Марка/Модель: ${order?.appointments?.vehicles?.make || ''} ${order?.appointments?.vehicles?.model || ''}</div>
              <div>Год: ${order?.appointments?.vehicles?.year || 'Не указан'}</div>
              <div>Гос. номер: ${order?.appointments?.vehicles?.license_plate || 'Не указан'}</div>
              ${order?.appointments?.vehicles?.vin ? `<div>VIN: ${order?.appointments?.vehicles?.vin}</div>` : ''}
            </div>
            
            <div class="info-block">
              <div class="info-title">Выполненные работы:</div>
              <table>
                <thead>
                  <tr>
                    <th>Услуга</th>
                    <th>Стоимость</th>
                  </tr>
                </thead>
                <tbody>
                  ${order?.work_order_services?.map((service: any) => `
                    <tr>
                      <td>${service.services?.name || 'Услуга'}</td>
                      <td>${formatCurrency(service.price)}</td>
                    </tr>
                  `).join('') || `
                    <tr>
                      <td colspan="2" style="text-align: center;">Нет данных об услугах</td>
                    </tr>
                  `}
                  <tr>
                    <td style="font-weight: bold;">Итого</td>
                    <td style="font-weight: bold;">${formatCurrency(order?.total_cost || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="info-block">
              <div class="info-title">Примечания:</div>
              <div>${order?.notes || 'Нет примечаний'}</div>
            </div>
            
            <div style="margin-top: 40px; display: flex; justify-content: space-between;">
              <div>
                <div style="margin-bottom: 30px;">Подпись механика: _________________</div>
                <div>Механик: ${order?.mechanic?.first_name || ''} ${order?.mechanic?.last_name || ''}</div>
              </div>
              <div>
                <div style="margin-bottom: 30px;">Подпись клиента: _________________</div>
                <div>Дата: ${new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
    } catch (error) {
      console.error('Ошибка при создании PDF:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать PDF. Попробуйте позже.",
        variant: "destructive"
      });
    }
  };
  
  const handleQualityCheckComplete = () => {
    setIsQualityCheckDialogOpen(false);
    setSelectedWorkOrderId(null);
    fetchWorkOrders();
  };

  const handleViewDetails = (id: string) => {
    navigate(`/admin/work-orders/${id}`);
  };
  
  const handleQualityCheck = (workOrderId: string) => {
    setSelectedWorkOrderId(workOrderId);
    setIsQualityCheckDialogOpen(true);
  };



  return (
    <div className="container mx-auto py-4 md:py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Заказ-наряды</h1>
          <p className="text-muted-foreground">
            Управление заказ-нарядами и их статусами
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Новый заказ-наряд
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список заказ-нарядов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Поиск по номеру заказа или клиенту..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Мобильное представление */}
          <div className="md:hidden space-y-4">
            {filteredWorkOrders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{order.order_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.appointments?.profiles ? 
                          `${order.appointments.profiles.first_name} ${order.appointments.profiles.last_name}` : 
                          'Клиент не указан'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getRuStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Автомобиль:</p>
                      <p>{order.appointments?.vehicles ? 
                        `${order.appointments.vehicles.make} ${order.appointments.vehicles.model}` : 
                        'Не указан'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Механик:</p>
                      <p>{order.mechanic ? 
                        `${order.mechanic.first_name} ${order.mechanic.last_name}` : 
                        'Не назначен'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Дата:</p>
                      <p>{order.appointments ? 
                        `${formatDate(order.appointments.appointment_date)} ${formatTime(order.appointments.start_time)}` : 
                        'Не указана'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Стоимость:</p>
                      <p>{order.total_cost ? 
                        `${formatCurrency(order.total_cost)}` : 
                        'Не указана'}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(order)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Редактировать
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePrint(order)}>
                      <Printer className="h-4 w-4 mr-2" />
                      Печать
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Это действие нельзя отменить. Заказ-наряд будет удален безвозвратно.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteWorkOrder(order.id)}>Удалить</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Десктопное представление */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер заказа</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Автомобиль</TableHead>
                  <TableHead>Дата и время</TableHead>
                  <TableHead>Механик</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Стоимость</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>
                      {order.appointments?.profiles ? 
                        `${order.appointments.profiles.first_name} ${order.appointments.profiles.last_name}` : 
                        'Нет данных'}
                    </TableCell>
                    <TableCell>
                      {order.appointments?.vehicles ? (
                        `${order.appointments.vehicles.make} ${order.appointments.vehicles.model} (${order.appointments.vehicles.license_plate})`
                      ) : (
                        'Нет данных'
                      )}
                    </TableCell>
                    <TableCell>
                      {order.appointments ? (
                        <>
                          {new Date(order.appointments.appointment_date).toLocaleDateString('ru-RU')}
                          <br />
                          {formatTime(order.appointments.start_time)} - {formatTime(order.appointments.end_time)}
                        </>
                      ) : (
                        'Нет данных'
                      )}
                    </TableCell>
                    <TableCell>
                      {order.mechanic ? (
                        <div>
                          <div>{`${order.mechanic.first_name} ${order.mechanic.last_name}`}</div>
                          <div className="text-sm text-muted-foreground">{order.mechanic.phone}</div>
                        </div>
                      ) : (
                        'Не назначен'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {getRuStatusText(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.total_cost ? (
                        <div>
                          <div>{formatCurrency(order.total_cost)}</div>
                          {order.appointments && order.appointments.total_price && order.appointments.total_price !== order.total_cost && (
                            <div className="text-sm text-muted-foreground">
                              Изначально: {formatCurrency(order.appointments.total_price)}
                            </div>
                          )}
                        </div>
                      ) : (
                        '0 ₽'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(order)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewDetails(order.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Подробнее
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Button
                              variant="ghost"
                              onClick={() => handlePrint(order)}
                              className="h-8 w-8 p-0"
                            >
                              <Printer className="mr-2 h-4 w-4" />
                              Печать заказ-наряда
                            </Button>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPDF(order)}>
                            <Download className="mr-2 h-4 w-4" />
                            Скачать PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleQualityCheck(order.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Проверка качества
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteWorkOrder(order.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Диалог создания/редактирования */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95%] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editWorkOrder ? "Редактировать заказ-наряд" : "Новый заказ-наряд"}
            </DialogTitle>
            <DialogDescription>
              {editWorkOrder
                ? "Внесите изменения в заказ-наряд"
                : "Создайте новый заказ-наряд"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="orderNumber" className="md:text-right">
                Номер заказа
              </Label>
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="md:col-span-3"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="md:text-right">
                Статус
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="md:col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Создан</SelectItem>
                  <SelectItem value="in_progress">В работе</SelectItem>
                  <SelectItem value="parts_waiting">Ожидает запчастей</SelectItem>
                  <SelectItem value="completed">Завершен</SelectItem>
                  <SelectItem value="quality_passed">Проверка пройдена</SelectItem>
                  <SelectItem value="quality_issues">Есть проблемы</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="mechanic" className="md:text-right">
                Механик
              </Label>
              <Select
                value={mechanicId || "none"}
                onValueChange={(value) => setMechanicId(value === "none" ? null : value)}
              >
                <SelectTrigger className="md:col-span-3">
                  <SelectValue placeholder="Выберите механика" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не назначен</SelectItem>
                  {mechanics.map((mechanic) => (
                    <SelectItem key={mechanic.id} value={mechanic.id}>
                      {mechanic.first_name} {mechanic.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Label className="font-semibold">Услуги</Label>
              <WorkOrderServicesEditor 
                workOrderServices={workOrderServices} 
                onChange={handleServicesChange} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="totalCost" className="md:text-right">
                Стоимость
              </Label>
              <Input
                id="totalCost"
                type="number"
                value={totalCost}
                onChange={(e) => setTotalCost(Number(e.target.value))}
                className="md:col-span-3"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="md:text-right">
                Дата начала
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="md:col-span-3"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="completionDate" className="md:text-right">
                Дата завершения
              </Label>
              <Input
                id="completionDate"
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="md:col-span-3"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                clearForm();
              }}
              className="w-full sm:w-auto"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              onClick={editWorkOrder ? updateWorkOrder : createWorkOrder}
              className="w-full sm:w-auto"
            >
              {editWorkOrder ? "Сохранить изменения" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {selectedWorkOrderId && (
        <QualityCheckDialog
          open={isQualityCheckDialogOpen}
          onOpenChange={setIsQualityCheckDialogOpen}
          workOrderId={selectedWorkOrderId}
          onComplete={handleQualityCheckComplete}
        />
      )}
    </div>
  );
};

export default AdminWorkOrders;
