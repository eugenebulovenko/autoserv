import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ChevronLeft } from "lucide-react";
import { Input } from "../components/ui/input";
import ServiceTracker from "../components/ServiceTracker";
import MainLayout from "../layouts/MainLayout";
import { formatCurrency } from "@/lib/utils";

interface WorkOrder {
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
  };
  order_status_updates?: Array<{
    status: string;
    created_at: string;
    comment?: string;
    profiles?: {
      first_name: string;
      last_name: string;
    };
  }>;
}

/**
 * Страница отслеживания статуса ремонта
 * @returns JSX элемент страницы отслеживания
 */
import { useEffect, useRef } from "react";

const ServiceTracking = () => {
  const { user, loading: authLoading, profile } = useAuth();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [workOrderId, setWorkOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const subscriptionRef = useRef<any>(null);

  // Загрузка всех заказов пользователя
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        // Получаем все appointment_id пользователя
        console.log('[ServiceTracking] user:', user);
        const { data: appointments, error: apptError } = await supabase
          .from('appointments')
          .select('id')
          .eq('user_id', user.id);
        if (apptError) throw apptError;
        const appointmentIds = (appointments || []).map(a => a.id);
        console.log('[ServiceTracking] appointmentIds:', appointmentIds);
        if (!appointmentIds || appointmentIds.length === 0) {
          setOrders([]);
          setOrdersLoading(false);
          return;
        }
        // Получаем все work_orders по appointment_id
        const { data: workOrders, error: woError } = await supabase
          .from('work_orders')
          .select(`
            id,
            order_number,
            created_at,
            description,
            total_cost,
            appointment_id,
            order_status_updates (
              status,
              created_at,
              comment,
              profiles:created_by (
                first_name,
                last_name
              )
            )
          `)
          .in('appointment_id', appointmentIds.length > 0 ? appointmentIds : ['']) // если пусто, подставить фиктивный id
          .order('created_at', { ascending: false });
        console.log('[ServiceTracking] workOrders:', workOrders, 'woError:', woError);
        if (woError) throw woError;
        // Если статусы не подтянулись вложенно — делаем отдельные запросы
        if (workOrders && workOrders.length > 0) {
          console.log('[ServiceTracking] workOrders (raw):', workOrders);
          const ordersWithStatuses = await Promise.all(
            workOrders.map(async (wo: any) => {
              console.log('[ServiceTracking] processing workOrder:', wo.order_number, 'id:', wo.id);
              let statusUpdates = wo.order_status_updates;
              // Только если есть id заказа, делаем отдельный запрос к статусам
              if ((!statusUpdates || statusUpdates.length === 0) && wo.id) {
                console.log('[ServiceTracking][SQL] Запрос статусов:', {
                  work_order_id: wo.id
                });
                const { data: statusData, error: statusError } = await supabase
                  .from("order_status_updates")
                  .select(`
                    status,
                    created_at,
                    comment
                  `)
                  .eq("work_order_id", wo.id)
                  .order("created_at", { ascending: true });
                if (statusError) {
                  console.error('[ServiceTracking] Error fetching statuses for', wo.id, statusError);
                }
                console.log('[ServiceTracking] statuses for', wo.order_number, 'id:', wo.id, statusData);
                statusUpdates = statusData || [];
              } else {
                console.log('[ServiceTracking] statuses (embedded) for', wo.order_number, 'id:', wo.id, statusUpdates);
              }
              // Приводим статусы к ожидаемому формату для UI
              const formattedStatuses = (statusUpdates || []).map((update: any) => ({
                status: update.status,
                created_at: update.created_at,
                comment: update.comment,
                profiles: update.profiles ? {
                  first_name: update.profiles.first_name,
                  last_name: update.profiles.last_name
                } : undefined
              }));
              return {
                ...wo,
                order_status_updates: formattedStatuses
              };
            })
          );
          console.log('[ServiceTracking] ordersWithStatuses (final):', ordersWithStatuses);
          console.log('[ServiceTracking] setOrders (final):', ordersWithStatuses);
          setOrders(ordersWithStatuses);
        } else {
          setOrders(workOrders || []);
        }
      } catch (err: any) {
        setOrdersError(err.message || 'Ошибка загрузки заказов');
      } finally {
        setOrdersLoading(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  // Автообновление истории статусов заказа через Supabase Realtime
  useEffect(() => {
    if (!isTracking || !orderNumber || !workOrderId) return;
    // Отписаться от предыдущей подписки, если есть
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    // Подписка на изменения статусов заказа по workOrderId
    const channel = supabase
      .channel('order-status-updates-' + workOrderId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_status_updates',
        filter: `work_order_id=eq.${workOrderId}`
      }, async () => {
        // Получаем обновлённую историю статусов
        const { data, error } = await supabase
          .from("work_orders")
          .select(`
            *,
            appointments!work_orders_appointment_id_fkey (
              profiles (
                first_name,
                last_name,
                phone
              ),
              vehicles (
                make,
                model,
                year,
                vin
              )
            ),
            order_status_updates (
              status,
              created_at,
              comment,
              profiles:created_by (
                first_name,
                last_name
              )
            )
          `)
          .eq("id", workOrderId)
          .single();
        if (!error && data) {
          const formattedData: WorkOrder = {
            order_number: data.order_number,
            created_at: data.created_at || new Date().toISOString(),
            description: null,
            total_cost: data.total_cost,
            appointments: data.appointments ? {
              profiles: {
                first_name: data.appointments.profiles?.first_name || '',
                last_name: data.appointments.profiles?.last_name || '',
                phone: data.appointments.profiles?.phone || null
              }
            } : undefined,
            order_status_updates: data.order_status_updates?.map(update => ({
              status: update.status,
              created_at: update.created_at || new Date().toISOString(),
              comment: update.comment || undefined,
              profiles: update.profiles ? {
                first_name: update.profiles.first_name || '',
                last_name: update.profiles.last_name || ''
              } : undefined
            })) || undefined
          };
          setWorkOrder(formattedData);
          // Push-уведомление (браузер)
          if (window.Notification && Notification.permission === "granted") {
            const lastUpdate = formattedData.order_status_updates?.slice(-1)[0];
            if (lastUpdate) {
              new Notification("Обновление статуса заказа", {
                body: `${lastUpdate.status}${lastUpdate.comment ? ": " + lastUpdate.comment : ""}`
              });
            }
          }
        }
      })
      .subscribe();
    subscriptionRef.current = channel;
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [isTracking, orderNumber, workOrderId]);

  // Запросить разрешение на push-уведомления при первом отслеживании
  useEffect(() => {
    if (isTracking && window.Notification && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [isTracking]);
  
  /**
   * Обработчик поиска заказа
   * @param e - Событие формы
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          *,
          appointments!work_orders_appointment_id_fkey (
            profiles (
              first_name,
              last_name,
              phone
            ),
            vehicles (
              make,
              model,
              year,
              vin
            )
          ),
          order_status_updates (
            status,
            created_at,
            comment,
            profiles:created_by (
              first_name,
              last_name
            )
          )
        `)
        .eq("order_number", orderNumber)
        .single();

      if (error) throw error;

      if (data) {
        // Временно делаем отдельный запрос к статусам, если вложенные не подтянулись
        let statusUpdates = data.order_status_updates;
        if (!statusUpdates || statusUpdates.length === 0) {
          const { data: statusData } = await supabase
            .from("order_status_updates")
            .select(`
              status,
              created_at,
              comment,
              profiles:created_by (
                first_name,
                last_name
              )
            `)
            .eq("work_order_id", data.id)
            .order("created_at", { ascending: true });
          statusUpdates = statusData || [];
        }
        const formattedData: WorkOrder = {
          order_number: data.order_number,
          created_at: data.created_at || new Date().toISOString(),
          description: null,
          total_cost: data.total_cost,
          appointments: data.appointments ? {
            profiles: {
              first_name: data.appointments.profiles?.first_name || '',
              last_name: data.appointments.profiles?.last_name || '',
              phone: data.appointments.profiles?.phone || null
            }
          } : undefined,
          order_status_updates: statusUpdates?.map((update: any) => ({
            status: update.status,
            created_at: update.created_at || new Date().toISOString(),
            comment: update.comment || undefined,
            profiles: update.profiles ? {
              first_name: update.profiles.first_name || '',
              last_name: update.profiles.last_name || ''
            } : undefined
          })) || undefined
        };
        setWorkOrder(formattedData);
        setWorkOrderId(data.id); // Сохраняем id заказа для подписки
        setIsTracking(true);
      } else {
        toast.error("Заказ не найден");
      }
    } catch (error) {
      console.error("Ошибка при поиске заказа:", error);
      toast.error("Ошибка при поиске заказа");
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <MainLayout>
      <div className="min-h-screen pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold mb-3">Отслеживание статуса ремонта</h1>
            <p className="text-foreground/70 max-w-xl mx-auto">
              Введите номер заказа для получения актуальной информации о ходе выполнения работ
            </p>
          </div>

          {/* Для авторизованных — список заказов */}
          {user && !isTracking && (
            <div className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-left">Мои заказы</h2>
              {ordersLoading || authLoading ? (
                <div className="text-center py-8 text-muted-foreground">Загрузка заказов...</div>
              ) : ordersError ? (
                <div className="text-center py-8 text-destructive">{ordersError}</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">У вас нет активных заказов.</div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.order_number} className="bg-white/80 rounded-lg shadow p-4 cursor-pointer hover:bg-blue-50 transition"
                      onClick={async () => {
                        setOrderNumber(order.order_number);
                        setLoading(true);
                        try {
                          const { data, error } = await supabase
                            .from("work_orders")
                            .select(`
                              *,
                              appointments (
                                profiles (
                                  first_name,
                                  last_name,
                                  phone
                                ),
                                vehicles (
                                  make,
                                  model,
                                  year,
                                  vin
                                )
                              ),
                              order_status_updates (
                                status,
                                created_at,
                                comment,
                                profiles:created_by (
                                  first_name,
                                  last_name
                                )
                              )
                            `)
                            .eq("order_number", order.order_number)
                            .single();
                          if (error) throw error;
                          let statusUpdates = data.order_status_updates;
                          if (!statusUpdates || statusUpdates.length === 0) {
                            const { data: statusData } = await supabase
                              .from("order_status_updates")
                              .select(`
                                status,
                                created_at,
                                comment,
                                profiles:created_by (
                                  first_name,
                                  last_name
                                )
                              `)
                              .eq("work_order_id", data.id)
                              .order("created_at", { ascending: true });
                            statusUpdates = statusData || [];
                          }
                          const formattedData = {
                            order_number: data.order_number,
                            created_at: data.created_at || new Date().toISOString(),
                            description: data.description || null,
                            total_cost: data.total_cost,
                            appointments: data.appointments ? {
                              profiles: {
                                first_name: data.appointments.profiles?.first_name || '',
                                last_name: data.appointments.profiles?.last_name || '',
                                phone: data.appointments.profiles?.phone || null
                              }
                            } : undefined,
                            order_status_updates: statusUpdates?.map((update: any) => ({
                              status: update.status,
                              created_at: update.created_at || new Date().toISOString(),
                              comment: update.comment || undefined,
                              profiles: update.profiles ? {
                                first_name: update.profiles.first_name || '',
                                last_name: update.profiles.last_name || ''
                              } : undefined
                            })) || undefined
                          };
                          setWorkOrder(formattedData);
                          setWorkOrderId(data.id);
                          setIsTracking(true);
                        } catch (error) {
                          toast.error("Ошибка при загрузке заказа");
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">Заказ №{order.order_number}</span>
                        <span className="text-xs text-muted-foreground">{order.created_at && new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">{order.description || 'Без описания'}</div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {order.total_cost !== null && <span>Сумма: {formatCurrency(order.total_cost)}</span>}
                        {/* Для краткого списка заказов теперь не показываем детали клиента и авто, чтобы избежать ошибок вложенности */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Поиск по номеру заказа (для всех, в т.ч. гостей) */}
          {!isTracking && (
            <div className="glass rounded-xl p-8 text-center">
              <form onSubmit={handleSearch} className="max-w-md mx-auto">
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Введите номер заказа (например: R-2023-0542)"
                    className="pl-10"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !orderNumber.trim()}
                >
                  {loading ? "Поиск..." : "Отследить"}
                </Button>
              </form>
            </div>
          )}

          {/* Детальный просмотр заказа */}
          {isTracking && (
            <>
              <div className="flex justify-between items-center mb-6">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsTracking(false)}
                      aria-label="Назад к поиску"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Назад к поиску</TooltipContent>
                </Tooltip>
                <span className="text-sm text-muted-foreground">
                  Заказ: <span className="font-medium">{orderNumber}</span>
                </span>
                <span className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1 ml-3">Автообновление включено</span>
              </div>
              <ServiceTracker workOrder={workOrder} />
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ServiceTracking;
