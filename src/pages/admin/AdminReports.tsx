import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import ReportFilters from "@/components/reports/ReportFilters";
import ReportCharts from "@/components/reports/ReportCharts";
import ReportExport from "@/components/reports/ReportExport";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowUpIcon, ArrowDownIcon, TrendingUp, TrendingDown, DollarSign, Users, Calendar, CheckCircle2, Clock, FileText, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getRuStatusText } from "@/utils/statusUtils";

interface MechanicStats {
  total: number;
  completed: number;
  inProgress: number;
  efficiency?: number; // Процент завершённых заказов
}

interface ClientStats {
  total: number;
  totalAmount: number;
  averageAmount?: number; // Средняя сумма заказа
}

interface ServiceStats {
  name: string;
  count: number;
  revenue: number;
  averagePrice: number;
}

interface SummaryStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  completedOrders: number;
  completionRate: number;
  topMechanic?: string;
  topService?: string;
  periodStart?: Date;
  periodEnd?: Date;
}

interface ReportData {
  summary: SummaryStats;
  workOrders: {
    raw: any[];
    statusChart: Array<{ name: string; value: number }>;
    mechanicChart: Array<{ name: string; value: number }>;
    timelineChart: Array<{ date: string; count: number; revenue: number }>;
  };
  services: {
    raw: any[];
    serviceChart: Array<{ name: string; value: number }>;
    revenueChart: Array<{ name: string; value: number }>;
    detailedStats: Record<string, ServiceStats>;
  };
  mechanics: {
    raw: any[];
    mechanicChart: Array<{ name: string } & MechanicStats>;
    performanceChart: Array<{ name: string; completed: number; inProgress: number }>;
  };
  clients: {
    raw: any[];
    clientChart: Array<{ name: string } & ClientStats>;
    spendingChart: Array<{ name: string; value: number }>;
  };
}

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState("work-orders");
  const [filters, setFilters] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData>({
    summary: {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      completedOrders: 0,
      completionRate: 0,
    },
    workOrders: {
      raw: [],
      statusChart: [],
      mechanicChart: [],
      timelineChart: [],
    },
    services: {
      raw: [],
      serviceChart: [],
      revenueChart: [],
      detailedStats: {},
    },
    mechanics: {
      raw: [],
      mechanicChart: [],
      performanceChart: [],
    },
    clients: {
      raw: [],
      clientChart: [],
      spendingChart: [],
    },
  });

  useEffect(() => {
    fetchReportData();
  }, [filters, activeTab]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      switch (activeTab) {
        case "work-orders":
          await fetchWorkOrdersReport();
          break;
        case "services":
          await fetchServicesReport();
          break;
        case "mechanics":
          await fetchMechanicsReport();
          break;
        case "clients":
          await fetchClientsReport();
          break;
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      setError("Не удалось загрузить данные отчета");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkOrdersReport = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("work_orders")
        .select(`
          id,
          created_at,
          completion_date,
          status,
          total_cost,
          description,
          mechanic:profiles!work_orders_mechanic_id_fkey (
            id,
            first_name,
            last_name
          ),
          work_order_services (
            id,
            price,
            quantity,
            services!work_order_services_service_id_fkey (
              id,
              name,
              price
            )
          )
        `);

      if (filters.dateRange?.from) {
        query = query.gte("created_at", filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        query = query.lte("created_at", filters.dateRange.to.toISOString());
      }
      // Проверяем, что значение фильтра не "all" и не undefined
      if (filters.mechanic && filters.mechanic !== 'all') {
        query = query.eq("mechanic_id", filters.mechanic);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq("status", filters.status);
      }
      // Фильтрация по услуге требует дополнительной обработки после получения данных
      // так как это связанная таблица

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Если есть фильтр по услуге, применяем его к полученным данным
      let filteredData = data;
      if (filters.service && filters.service !== 'all') {
        filteredData = data.filter(order => {
          return order.work_order_services.some((service: any) => 
            service.services?.id === filters.service
          );
        });
      }

      // Преобразуем данные для графиков
      const statusData = filteredData.reduce((acc: Record<string, number>, order: any) => {
        const statusLabel = getStatusLabel(order.status);
        acc[statusLabel] = (acc[statusLabel] || 0) + 1;
        return acc;
      }, {});

      const mechanicData = filteredData.reduce((acc: Record<string, number>, order: any) => {
        const mechanicName = order.mechanic ? `${order.mechanic.first_name} ${order.mechanic.last_name}` : 'Не назначен';
        acc[mechanicName] = (acc[mechanicName] || 0) + 1;
        return acc;
      }, {});

      // Группируем заказы по дате для временной шкалы
      const timelineData: Record<string, {count: number, revenue: number}> = {};
      
      filteredData.forEach((order: any) => {
        const date = order.created_at ? new Date(order.created_at).toISOString().split('T')[0] : 'Неизвестно';
        if (!timelineData[date]) {
          timelineData[date] = { count: 0, revenue: 0 };
        }
        timelineData[date].count++;
        timelineData[date].revenue += order.total_cost || 0;
      });
      
      // Сортируем даты для графика
      const sortedTimelineData = Object.entries(timelineData)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, data]) => ({
          date: formatDate(new Date(date), 'short'),
          count: data.count,
          revenue: data.revenue
        }));
      
      // Рассчитываем сводную статистику
      const totalOrders = filteredData.length;
      const totalRevenue = filteredData.reduce((sum, order) => sum + (order.total_cost || 0), 0);
      const completedOrders = filteredData.filter(order => order.status === 'completed').length;
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
      
      // Находим топ механика и услугу
      const topMechanicEntry = Object.entries(mechanicData).sort((a, b) => b[1] - a[1])[0];
      const topMechanic = topMechanicEntry ? topMechanicEntry[0] : undefined;
      
      // Собираем все услуги из заказов
      const allServices: Record<string, number> = {};
      filteredData.forEach(order => {
        order.work_order_services.forEach((service: any) => {
          const serviceName = service.services?.name || 'Неизвестная услуга';
          allServices[serviceName] = (allServices[serviceName] || 0) + 1;
        });
      });
      
      const topServiceEntry = Object.entries(allServices).sort((a, b) => b[1] - a[1])[0];
      const topService = topServiceEntry ? topServiceEntry[0] : undefined;

      setReportData({
        ...reportData,
        summary: {
          totalOrders,
          totalRevenue,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          completedOrders,
          completionRate,
          topMechanic,
          topService,
          periodStart: filters.dateRange?.from,
          periodEnd: filters.dateRange?.to
        },
        workOrders: {
          raw: filteredData,
          statusChart: Object.entries(statusData).map(([name, value]) => ({
            name,
            value: Number(value),
          })),
          mechanicChart: Object.entries(mechanicData).map(([name, value]) => ({
            name,
            value: Number(value),
          })),
          timelineChart: sortedTimelineData,
        },
      });
    } catch (error) {
      console.error("Error fetching work orders:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные заказ-нарядов",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Вспомогательная функция для получения читаемого названия статуса
  const getStatusLabel = (status: string): string => getRuStatusText(status);

  const fetchServicesReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем заказы с услугами
      let query = supabase
        .from('work_orders')
        .select(`
          id,
          created_at,
          status,
          total_cost,
          work_order_services (
            id,
            price,
            quantity,
            service_id,
            services!work_order_services_service_id_fkey (
              id,
              name,
              price,
              description
            )
          )
        `);

      if (filters.dateRange?.from) {
        query = query.gte("created_at", filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        query = query.lte("created_at", filters.dateRange.to.toISOString());
      }
      if (filters.mechanic && filters.mechanic !== 'all') {
        query = query.eq("mechanic_id", filters.mechanic);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq("status", filters.status);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      // Фильтруем по конкретной услуге, если указана
      let filteredData = data;
      if (filters.service && filters.service !== 'all') {
        filteredData = data.filter(order => {
          return order.work_order_services.some((service: any) => 
            service.service_id === filters.service
          );
        });
      }

      // Собираем все услуги из заказов
      const serviceStats: Record<string, ServiceStats> = {};
      let totalServices = 0;
      
      filteredData.forEach(order => {
        order.work_order_services.forEach((service: any) => {
          const serviceName = service.services?.name || 'Неизвестная услуга';
          const serviceId = service.services?.id || 'unknown';
          const price = service.price || 0;
          const quantity = service.quantity || 1;
          const revenue = price * quantity;
          
          if (!serviceStats[serviceId]) {
            serviceStats[serviceId] = {
              name: serviceName,
              count: 0,
              revenue: 0,
              averagePrice: 0
            };
          }
          
          serviceStats[serviceId].count += quantity;
          serviceStats[serviceId].revenue += revenue;
          totalServices += quantity;
        });
      });
      
      // Рассчитываем средние цены
      Object.values(serviceStats).forEach(stat => {
        stat.averagePrice = stat.count > 0 ? stat.revenue / stat.count : 0;
      });

      // Преобразуем данные для графиков
      const serviceChartData = Object.values(serviceStats).map(stat => ({
        name: stat.name,
        value: stat.count
      }));
      
      const revenueChartData = Object.values(serviceStats).map(stat => ({
        name: stat.name,
        value: stat.revenue
      }));
      
      // Сортируем по популярности
      serviceChartData.sort((a, b) => b.value - a.value);
      revenueChartData.sort((a, b) => b.value - a.value);

      setReportData({
        ...reportData,
        services: {
          raw: filteredData,
          serviceChart: serviceChartData,
          revenueChart: revenueChartData,
          detailedStats: serviceStats
        },
      });
    } catch (error) {
      console.error('Error fetching services report:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить отчет по услугам",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMechanicsReport = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("work_orders")
        .select(`
          *,
          mechanic:profiles!work_orders_mechanic_id_fkey (
            first_name,
            last_name
          )
        `);

      if (filters.dateRange?.from) {
        query = query.gte("created_at", filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        query = query.lte("created_at", filters.dateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Преобразуем данные для графиков
      const mechanicData = data.reduce((acc: Record<string, MechanicStats>, order: any) => {
        const mechanicName = order.mechanic ? `${order.mechanic.first_name} ${order.mechanic.last_name}` : 'Не назначен';
        if (!acc[mechanicName]) {
          acc[mechanicName] = {
            total: 0,
            completed: 0,
            inProgress: 0,
          };
        }
        acc[mechanicName].total++;
        if (order.status === "completed") acc[mechanicName].completed++;
        if (order.status === "in_progress") acc[mechanicName].inProgress++;
        return acc;
      }, {});

      setReportData({
        ...reportData,
        mechanics: {
          raw: data,
          mechanicChart: Object.entries(mechanicData).map(([name, stats]) => ({
            name,
            ...stats,
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching mechanics report:", error);
      setError("Не удалось загрузить данные по механикам");
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsReport = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("work_orders")
        .select(`
          *,
          client:profiles!work_orders_client_id_fkey (
            first_name,
            last_name
          )
        `);

      if (filters.dateRange?.from) {
        query = query.gte("created_at", filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        query = query.lte("created_at", filters.dateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Преобразуем данные для графиков
      const clientData = data.reduce((acc: Record<string, ClientStats>, order: any) => {
        const clientName = order.client ? `${order.client.first_name} ${order.client.last_name}` : 'Неизвестный клиент';
        if (!acc[clientName]) {
          acc[clientName] = {
            total: 0,
            totalAmount: 0,
          };
        }
        acc[clientName].total++;
        acc[clientName].totalAmount += order.total_cost || 0;
        return acc;
      }, {});

      setReportData({
        ...reportData,
        clients: {
          raw: data,
          clientChart: Object.entries(clientData).map(([name, stats]) => ({
            name,
            ...stats,
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching clients report:", error);
      setError("Не удалось загрузить данные по клиентам");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  // Компонент сводной статистики
  const ReportSummary = () => {
    const { totalOrders, totalRevenue, averageOrderValue, completedOrders, completionRate, topMechanic, topService } = reportData.summary;
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-sm">Всего заказов</span>
                <span className="text-2xl font-bold">{formatNumber(totalOrders)}</span>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <span className="flex items-center">
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                Завершено: {formatNumber(completedOrders)} ({formatNumber(completionRate, 1)}%)
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-sm">Общая выручка</span>
                <span className="text-2xl font-bold">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <span className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                Средний чек: {formatCurrency(averageOrderValue)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-sm">Лучший механик</span>
                <span className="text-xl font-bold truncate max-w-[180px]">{topMechanic || 'Нет данных'}</span>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <span>Наибольшее количество выполненных заказов</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-sm">Популярная услуга</span>
                <span className="text-xl font-bold truncate max-w-[180px]">{topService || 'Нет данных'}</span>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <span>Самая востребованная услуга в периоде</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Отчеты</h1>
        <p className="text-muted-foreground">
          Анализ данных и статистика по различным аспектам работы сервиса
        </p>
      </div>
      
      {/* Отображаем сводную статистику */}
      <ReportSummary />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="work-orders">Заказ-наряды</TabsTrigger>
          <TabsTrigger value="services">Услуги</TabsTrigger>
          <TabsTrigger value="mechanics">Механики</TabsTrigger>
          <TabsTrigger value="clients">Клиенты</TabsTrigger>
        </TabsList>

        <TabsContent value="work-orders">
          <ReportFilters
            onFilterChange={handleFilterChange}
            reportType="work-orders"
            activeFilters={filters}
          />
          <div className="grid gap-6 md:grid-cols-2">
            <ReportCharts
              data={reportData.workOrders?.statusChart || []}
              type="pie"
              title="Статусы заказ-нарядов"
              description="Распределение заказов по текущим статусам"
              showLabels={true}
            />
            <ReportCharts
              data={reportData.workOrders?.mechanicChart || []}
              type="bar"
              title="Загрузка механиков"
              description="Количество заказов по механикам"
              valueFormatter={(value) => formatNumber(value)}
              showLabels={true}
            />
          </div>
          
          <div className="mt-6">
            <ReportCharts
              data={reportData.workOrders?.timelineChart || []}
              type="area"
              title="Динамика заказов по датам"
              description="Количество заказов и выручка по дням"
              xAxisKey="date"
              dataKey="count"
              secondaryDataKey="revenue"
              valueFormatter={(value) => formatNumber(value)}
              height={300}
            />
          </div>
          
          <div className="mt-6">
            <ReportExport
              data={reportData.workOrders?.raw || []}
              filename="work-orders-report"
              title="Отчет по заказ-нарядам"
            />
          </div>
        </TabsContent>

        <TabsContent value="services">
          <ReportFilters
            onFilterChange={handleFilterChange}
            reportType="services"
            activeFilters={filters}
          />
          <div className="grid gap-6 md:grid-cols-2">
            <ReportCharts
              data={reportData.services?.serviceChart || []}
              type="bar"
              title="Популярность услуг"
              description="Количество заказов по типам услуг"
              valueFormatter={(value) => formatNumber(value)}
              showLabels={true}
            />
            <ReportCharts
              data={reportData.services?.revenueChart || []}
              type="bar"
              title="Доходность услуг"
              description="Выручка по типам услуг"
              valueFormatter={(value) => formatCurrency(value)}
              showLabels={true}
            />
          </div>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Детализация по услугам</CardTitle>
                <CardDescription>Подробная информация о каждой услуге за выбранный период</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left font-medium">Услуга</th>
                        <th className="p-2 text-left font-medium">Количество</th>
                        <th className="p-2 text-left font-medium">Ср. цена</th>
                        <th className="p-2 text-left font-medium">Выручка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(reportData.services.detailedStats).map((stat, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{stat.name}</td>
                          <td className="p-2">{formatNumber(stat.count)}</td>
                          <td className="p-2">{formatCurrency(stat.averagePrice)}</td>
                          <td className="p-2">{formatCurrency(stat.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6">
            <ReportExport
              data={reportData.services?.raw || []}
              filename="services-report"
              title="Отчет по услугам"
            />
          </div>
        </TabsContent>

        <TabsContent value="mechanics">
          <ReportFilters
            onFilterChange={handleFilterChange}
            reportType="work-orders"
          />
          <Card>
            <CardHeader>
              <CardTitle>Эффективность механиков</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportCharts
                data={reportData.mechanics?.mechanicChart || []}
                type="bar"
                title="Статистика по механикам"
                dataKey="total"
              />
            </CardContent>
          </Card>
          <div className="mt-6">
            <ReportExport
              data={reportData.mechanics?.raw || []}
              filename="mechanics-report"
              title="Отчет по механикам"
            />
          </div>
        </TabsContent>

        <TabsContent value="clients">
          <ReportFilters
            onFilterChange={handleFilterChange}
            reportType="work-orders"
          />
          <Card>
            <CardHeader>
              <CardTitle>Активность клиентов</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportCharts
                data={reportData.clients?.clientChart || []}
                type="bar"
                title="Статистика по клиентам"
                dataKey="total"
              />
            </CardContent>
          </Card>
          <div className="mt-6">
            <ReportExport
              data={reportData.clients?.raw || []}
              filename="clients-report"
              title="Отчет по клиентам"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;
