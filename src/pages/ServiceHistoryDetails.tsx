import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { getRuStatusText } from "../utils/statusUtils";
import WorkOrderPrint from "@/components/WorkOrderPrint";
import ServiceTracker from "@/components/ServiceTracker";
import { formatCurrency } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar, 
  Car, 
  Clock, 
  FileText, 
  User, 
  Printer,
  FileDown,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import MainLayout from "@/layouts/MainLayout";

const ServiceHistoryDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [statusUpdates, setStatusUpdates] = useState<any[]>([]);
  const [workStages, setWorkStages] = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchWorkOrderDetails();
    }
  }, [id]);

  const fetchWorkOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Получаем данные о заказ-наряде
      const { data: workOrderData, error: workOrderError } = await supabase
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
            services!work_order_services_service_id_fkey (
              id,
              name,
              description,
              price
            )
          )
        `)
        .eq('id', id)
        .single();
      
      if (workOrderError) throw workOrderError;
      
      // Проверяем, принадлежит ли заказ текущему пользователю
      if (workOrderData && workOrderData.appointments && workOrderData.appointments.user_id !== user?.id) {
        toast({
          title: "Доступ запрещен",
          description: "У вас нет доступа к этому заказу",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }
      
      setWorkOrder(workOrderData);
      
      // Получаем историю статусов заказа
      const { data: statusData, error: statusError } = await supabase
        .from('order_status_updates')
        .select(`
          id,
          status,
          comment,
          created_at,
          created_by,
          profiles:created_by (
            first_name,
            last_name,
            role
          )
        `)
        .eq('work_order_id', id)
        .order('created_at', { ascending: true });
      
      if (statusError) throw statusError;
      
      setStatusUpdates(statusData || []);
      
      // Получаем этапы работ
      const { data: stagesData, error: stagesError } = await supabase
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
        .eq('work_order_id', id)
        .order('stage(order_index)', { ascending: true });
      
      if (stagesError) throw stagesError;
      
      setWorkStages(stagesData || []);
      
    } catch (error) {
      console.error('Error fetching work order details:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные о заказе",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
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
            <title>Заказ-наряд №${workOrder?.order_number}</title>
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
              <h1>Заказ-наряд №${workOrder?.order_number}</h1>
              <div>Дата: ${new Date().toLocaleDateString()}</div>
            </div>
            
            <div class="info-block">
              <div class="info-title">Информация о клиенте:</div>
              <div>ФИО: ${workOrder?.appointments?.profiles?.first_name || ''} ${workOrder?.appointments?.profiles?.last_name || ''}</div>
              <div>Телефон: ${workOrder?.appointments?.profiles?.phone || 'Не указан'}</div>
              <div>Email: ${workOrder?.appointments?.profiles?.email || 'Не указан'}</div>
            </div>
            
            <div class="info-block">
              <div class="info-title">Информация об автомобиле:</div>
              <div>Марка/Модель: ${workOrder?.appointments?.vehicles?.make || ''} ${workOrder?.appointments?.vehicles?.model || ''}</div>
              <div>Год: ${workOrder?.appointments?.vehicles?.year || 'Не указан'}</div>
              <div>Гос. номер: ${workOrder?.appointments?.vehicles?.license_plate || 'Не указан'}</div>
              ${workOrder?.appointments?.vehicles?.vin ? `<div>VIN: ${workOrder?.appointments?.vehicles?.vin}</div>` : ''}
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
                  ${workOrder?.work_order_services?.map((service: any) => `
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
                    <td style="font-weight: bold;">${formatCurrency(calculateTotalPrice())}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="info-block">
              <div class="info-title">Примечания:</div>
              <div>${workOrder?.notes || 'Нет примечаний'}</div>
            </div>
            
            <div style="margin-top: 40px; display: flex; justify-content: space-between;">
              <div>
                <div style="margin-bottom: 30px;">Подпись механика: _________________</div>
                <div>Механик: ${workOrder?.mechanic?.first_name || ''} ${workOrder?.mechanic?.last_name || ''}</div>
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
  };

  const handleDownloadPDF = async () => {
    try {
      // Здесь можно добавить логику для скачивания PDF
      // Например, с использованием jsPDF или другой библиотеки
      toast({
        title: "Скачивание PDF",
        description: "Функция скачивания PDF будет доступна в ближайшее время"
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось скачать PDF",
        variant: "destructive"
      });
    }
  };

  const formatDateTime = (date: string, time?: string) => {
    if (!date) return "Не указано";
    
    const dateObj = new Date(date);
    let formattedDate = format(dateObj, 'dd MMMM yyyy', { locale: ru });
    
    if (time) {
      formattedDate += `, ${time}`;
    }
    
    return formattedDate;
  };

  const getStatusBadge = (status: string) => {
    const statusText = getRuStatusText(status);
    
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    
    switch (status) {
      case 'completed':
        variant = "default";
        break;
      case 'in_progress':
        variant = "secondary";
        break;
      case 'cancelled':
        variant = "destructive";
        break;
      default:
        variant = "outline";
    }
    
    return <Badge variant={variant}>{statusText}</Badge>;
  };

  const calculateTotalPrice = () => {
    if (!workOrder || !workOrder.work_order_services) return 0;
    
    return workOrder.work_order_services.reduce((total: number, service: any) => {
      return total + (service.price || 0);
    }, 0);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!workOrder) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">Заказ не найден</h2>
            <p className="text-muted-foreground mb-6">Запрашиваемый заказ не существует или был удален</p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Вернуться на главную
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">Заказ-наряд №{workOrder.order_number}</CardTitle>
                    <CardDescription>
                      Создан: {new Date(workOrder.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div>
                    {getStatusBadge(workOrder.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Информация о заказе</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Дата: {formatDateTime(workOrder.appointments?.appointment_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Время: {workOrder.appointments?.start_time || "Не указано"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Описание: {workOrder.notes || "Не указано"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Автомобиль</h3>
                    {workOrder.appointments?.vehicles && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {workOrder.appointments.vehicles.make} {workOrder.appointments.vehicles.model} ({workOrder.appointments.vehicles.year})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Гос. номер: {workOrder.appointments.vehicles.license_plate || "Не указан"}
                          </span>
                        </div>
                        {workOrder.appointments.vehicles.vin && (
                          <div className="flex items-center gap-2">
                            <span className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              VIN: {workOrder.appointments.vehicles.vin}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Исполнитель</h3>
                  {workOrder.mechanic ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {workOrder.mechanic.first_name} {workOrder.mechanic.last_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Механик не назначен</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Услуги и стоимость */}
            <Card>
              <CardHeader>
                <CardTitle>Услуги и стоимость</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Услуга</TableHead>
                      <TableHead className="text-right">Стоимость</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrder.work_order_services && workOrder.work_order_services.length > 0 ? (
                      workOrder.work_order_services.map((service: any) => (
                        <TableRow key={service.id}>
                          <TableCell>
                            {service.services?.name || "Услуга"}
                            {service.quantity > 1 && ` (${service.quantity} шт.)`}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(service.price)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          Нет данных об услугах
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell className="font-medium">Итого</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(calculateTotalPrice())}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleDownloadPDF}>
                  <FileDown className="mr-2 h-4 w-4" /> Скачать PDF
                </Button>
                <Button onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" /> Печать
                </Button>
              </CardFooter>
            </Card>

            {/* Этапы работ */}
            <Card>
              <CardHeader>
                <CardTitle>Этапы выполнения работ</CardTitle>
              </CardHeader>
              <CardContent>
                {workStages.length > 0 ? (
                  <div className="space-y-4">
                    {workStages.map((stage, index) => (
                      <div 
                        key={stage.id} 
                        className={`p-4 rounded-md border ${stage.is_completed ? 'bg-muted/30' : 'border-border'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {stage.is_completed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-base font-medium">
                                {index + 1}. {stage.stage.name}
                              </h4>
                              {stage.is_completed ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Завершен
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                  Ожидает
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {stage.stage.description}
                            </p>
                            
                            {stage.comments && (
                              <div className="mt-2 p-2 bg-muted/20 rounded text-sm">
                                <span className="font-medium">Комментарий:</span> {stage.comments}
                              </div>
                            )}
                            
                            {stage.completed_at && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Завершен: {new Date(stage.completed_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Нет данных об этапах работ
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Отслеживание заказа */}
            <Card>
              <CardHeader>
                <CardTitle>Отслеживание заказа</CardTitle>
              </CardHeader>
              <CardContent>
                <ServiceTracker workOrder={workOrder} />
              </CardContent>
            </Card>

            {/* История статусов */}
            <Card>
              <CardHeader>
                <CardTitle>История статусов</CardTitle>
              </CardHeader>
              <CardContent>
                {statusUpdates.length > 0 ? (
                  <div className="space-y-4">
                    {statusUpdates.map((update, index) => (
                      <div key={update.id} className="relative pl-6 pb-4">
                        {index < statusUpdates.length - 1 && (
                          <div className="absolute top-2 left-2 bottom-0 w-0.5 bg-muted-foreground/20"></div>
                        )}
                        <div className="absolute top-2 left-0 w-4 h-4 rounded-full bg-primary"></div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {getRuStatusText(update.status)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(update.created_at).toLocaleString()}
                            </span>
                          </div>
                          {update.comment && (
                            <p className="text-sm text-muted-foreground">{update.comment}</p>
                          )}
                          {update.profiles && (
                            <p className="text-xs text-muted-foreground">
                              {update.profiles.first_name} {update.profiles.last_name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Нет данных об изменениях статуса
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Скрытый блок для печати */}
        <div className="hidden">
          <div ref={printRef} className="p-6 bg-white">
            <WorkOrderPrint workOrder={workOrder} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ServiceHistoryDetails;
