import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { format, subMonths } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { XCircleIcon, FilterIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { getRuStatusText } from "@/utils/statusUtils";

interface ReportFiltersProps {
  onFilterChange: (filters: any) => void;
  reportType: "work-orders" | "services" | "mechanics" | "clients";
  activeFilters?: any;
}

const ReportFilters = ({ onFilterChange, reportType, activeFilters }: ReportFiltersProps) => {
  // Установка начального диапазона дат (последние 3 месяца)
  const defaultDateRange: DateRange = {
    from: subMonths(new Date(), 3),
    to: new Date()
  };
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const [mechanic, setMechanic] = useState<string | undefined>(undefined);
  const [service, setService] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [mechanics, setMechanics] = useState<Array<{ id: string; name: string }>>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  const [statuses] = useState([
    { value: "pending", label: "Ожидает" },
    { value: "in_progress", label: "В работе" },
    { value: "completed", label: "Завершен" },
    { value: "cancelled", label: "Отменен" },
  ]);
  
  // Инициализация фильтров при первой загрузке
  useEffect(() => {
    onFilterChange({ dateRange: defaultDateRange });
  }, []);
  
  // Синхронизация с активными фильтрами
  useEffect(() => {
    if (activeFilters) {
      if (activeFilters.dateRange) setDateRange(activeFilters.dateRange);
      setMechanic(activeFilters.mechanic || 'all');
      setService(activeFilters.service || 'all');
      setStatus(activeFilters.status || 'all');
    }
  }, [activeFilters]);

  // Загрузка механиков
  useEffect(() => {
    const fetchMechanics = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'mechanic')
        .order('first_name');

      if (error) {
        console.error('Error fetching mechanics:', error);
        return;
      }

      // Преобразуем данные в нужный формат
      setMechanics(
        (data || []).map(mechanic => ({
          id: mechanic.id,
          name: `${mechanic.first_name} ${mechanic.last_name}`
        }))
      );
    };

    fetchMechanics();
  }, []);

  // Загрузка услуг
  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching services:', error);
        return;
      }

      setServices(data || []);
    };

    fetchServices();
  }, []);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    applyFilters({ dateRange: range });
  };

  const handleMechanicChange = (value: string) => {
    // Если выбрано "все механики", устанавливаем undefined
    const mechanicValue = value === 'all' ? undefined : value;
    setMechanic(value);
    applyFilters({ mechanic: mechanicValue });
  };

  const handleServiceChange = (value: string) => {
    // Если выбрано "все услуги", устанавливаем undefined
    const serviceValue = value === 'all' ? undefined : value;
    setService(value);
    applyFilters({ service: serviceValue });
  };

  const handleStatusChange = (value: string) => {
    // Если выбрано "все статусы", устанавливаем undefined
    const statusValue = value === 'all' ? undefined : value;
    setStatus(value);
    applyFilters({ status: statusValue });
  };
  
  const applyFilters = (newFilter: any) => {
    const updatedFilters = {
      dateRange,
      mechanic,
      service,
      status,
      ...newFilter
    };
    onFilterChange(updatedFilters);
  };
  
  const resetFilters = () => {
    setDateRange(defaultDateRange);
    setMechanic('all');
    setService('all');
    setStatus('all');
    onFilterChange({ dateRange: defaultDateRange });
    
    toast.success("Все фильтры были сброшены до значений по умолчанию");
  };

  // Проверка наличия активных фильтров
  const hasActiveFilters = mechanic || service || status || 
    (dateRange && (dateRange.from || dateRange.to));
    
  // Получение имени механика по ID
  const getMechanicName = (mechanic: string) => {
    const found = mechanics.find(m => m.id === mechanic);
    return found ? found.name : '';
  };
  
  // Получение имени услуги по ID
  const getServiceName = (service: string) => {
    const found = services.find(s => s.id === service);
    return found ? found.name : '';
  };
  
  // Получение названия статуса по значению
  const getStatusLabel = (value: string) => getRuStatusText(value);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Фильтры отчета</CardTitle>
            <CardDescription>Настройте параметры для получения нужных данных</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={resetFilters}>
                  <XCircleIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Сбросить все фильтры</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Отображение активных фильтров */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-2">
            {dateRange?.from && (
              <Badge variant="secondary">
                Период: {format(dateRange.from, 'dd.MM.yyyy')} 
                {dateRange.to && ` - ${format(dateRange.to, 'dd.MM.yyyy')}`}
              </Badge>
            )}
            {mechanic && (
              <Badge variant="secondary">
                Механик: {getMechanicName(mechanic)}
              </Badge>
            )}
            {service && (
              <Badge variant="secondary">
                Услуга: {getServiceName(service)}
              </Badge>
            )}
            {status && (
              <Badge variant="secondary">
                Статус: {getStatusLabel(status)}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Период</Label>
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>

          {(reportType === "work-orders" || reportType === "mechanics") && (
            <>
              <div className="space-y-2">
                <Label>Механик</Label>
                <Select onValueChange={handleMechanicChange} value={mechanic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите механика" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все механики</SelectItem>
                    {mechanics.map((mechanic) => (
                      <SelectItem key={mechanic.id} value={mechanic.id}>
                        {mechanic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Статус</Label>
                <Select onValueChange={handleStatusChange} value={status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {getRuStatusText(status.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {(reportType === "services" || reportType === "work-orders") && (
            <div className="space-y-2">
              <Label>Услуга</Label>
              <Select onValueChange={handleServiceChange} value={service}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите услугу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все услуги</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={() => applyFilters({})} className="gap-2">
            <FilterIcon className="h-4 w-4" />
            Применить фильтры
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportFilters;