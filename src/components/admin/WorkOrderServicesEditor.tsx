import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

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

interface WorkOrderServicesEditorProps {
  workOrderServices: WorkOrderService[];
  onChange: (services: WorkOrderService[], totalCost: number) => void;
}

const WorkOrderServicesEditor: React.FC<WorkOrderServicesEditorProps> = ({
  workOrderServices: initialWorkOrderServices,
  onChange
}) => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [workOrderServices, setWorkOrderServices] = useState<WorkOrderService[]>(initialWorkOrderServices || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);
  
  // Обновляем локальное состояние при изменении входных данных
  useEffect(() => {
    setWorkOrderServices(initialWorkOrderServices || []);
  }, [initialWorkOrderServices]);

  useEffect(() => {
    // Рассчитываем общую стоимость и отправляем обновленные услуги родительскому компоненту
    const activeServices = workOrderServices.filter(s => !s.isDeleted);
    const totalCost = activeServices.reduce((sum, service) => sum + (service.price * (service.quantity || 1)), 0);
    onChange(workOrderServices, totalCost);
  }, [workOrderServices]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setServices(data || []);
    } catch (error) {
      console.error('Ошибка при загрузке услуг:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список услуг',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Функция для добавления новой услуги в заказ-наряд
  const addService = () => {
    if (services.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Список услуг пуст',
        variant: 'destructive'
      });
      return;
    }
    
    // Берем первую услугу в списке как значение по умолчанию
    const defaultService = services[0];
    
    // Создаем новую услугу для заказ-наряда
    const newService: WorkOrderService = {
      work_order_id: '',  // Будет заполнено при сохранении
      service_id: defaultService.id,
      price: defaultService.price,
      quantity: 1,
      services: defaultService,
      isNew: true
    };
    
    setWorkOrderServices([...workOrderServices, newService]);
  };

  // Функция для удаления услуги из заказ-наряда
  const removeService = (index: number) => {
    const updatedServices = [...workOrderServices];
    
    // Если услуга уже существует в БД, помечаем ее как удаленную
    if (updatedServices[index].id) {
      updatedServices[index].isDeleted = true;
      setWorkOrderServices(updatedServices);
    } else {
      // Если услуга еще не сохранена в БД, просто удаляем ее из массива
      setWorkOrderServices(updatedServices.filter((_, i) => i !== index));
    }
  };

  // Функция для обновления услуги
  const updateService = (index: number, field: string, value: any) => {
    const updatedServices = [...workOrderServices];
    
    if (field === 'service_id') {
      // Если меняем услугу, обновляем и связанные данные
      const selectedService = services.find(s => s.id === value);
      if (selectedService) {
        updatedServices[index].service_id = value;
        updatedServices[index].services = selectedService;
        // Обновляем цену по умолчанию, если пользователь не изменял ее вручную
        if (!updatedServices[index].priceManuallySet) {
          updatedServices[index].price = selectedService.price;
        }
      }
    } else if (field === 'price') {
      updatedServices[index].price = value;
      updatedServices[index].priceManuallySet = true;
    } else if (field === 'quantity') {
      updatedServices[index].quantity = value;
    }
    
    setWorkOrderServices(updatedServices);
  };

  // Обработчики событий для изменения полей услуг
  const handleServiceChange = (index: number, serviceId: string) => {
    updateService(index, 'service_id', serviceId);
  };

  const handlePriceChange = (index: number, price: string) => {
    updateService(index, 'price', parseFloat(price) || 0);
  };

  const handleQuantityChange = (index: number, quantity: string) => {
    updateService(index, 'quantity', parseInt(quantity) || 1);
  };

  // Получаем только активные (не удаленные) услуги
  const activeServices = workOrderServices.filter(service => !service.isDeleted);
  
  // Вычисляем общую стоимость
  const totalCost = activeServices.reduce((sum, service) => {
    return sum + (service.price * (service.quantity || 1));
  }, 0);

  return (
    <div className="space-y-4">
      {loading ? (
        <div>Загрузка услуг...</div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Услуги</h3>
            <Button onClick={addService} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Добавить услугу
            </Button>
          </div>

          {activeServices.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Нет добавленных услуг
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Услуга</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Кол-во</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeServices.map((service, index) => (
                  <TableRow key={service.id || `new-${index}`}>
                    <TableCell>
                      <Select
                        value={service.service_id}
                        onValueChange={(value) => handleServiceChange(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите услугу" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={service.price}
                        onChange={(e) => handlePriceChange(index, e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={service.quantity || 1}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="w-16"
                        min="1"
                      />
                    </TableCell>
                    <TableCell>
                      {((service.price || 0) * (service.quantity || 1)).toLocaleString('ru-RU', {
                        style: 'currency',
                        currency: 'RUB'
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeService(workOrderServices.findIndex(s => s === service))}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-end">
            <div className="text-lg font-medium">
              Итого: {totalCost.toLocaleString('ru-RU', {
                style: 'currency',
                currency: 'RUB'
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkOrderServicesEditor;
