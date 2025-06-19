import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  category_id: string;
  category_name?: string;
}

interface Category {
  id: string;
  name: string;
}

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<Partial<Service>>({
    name: "",
    description: "",
    price: 0,
    duration: 0,
    category_id: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Не удалось загрузить услуги. Пожалуйста, попробуйте позже.');
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить услуги. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить категории. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    }
  };

  const handleCreateService = async () => {
    try {
      // Проверяем и преобразуем данные перед отправкой
      const serviceToCreate = {
        name: newService.name?.trim() || "",
        description: newService.description?.trim() || null,
        price: typeof newService.price === 'string' ? parseFloat(newService.price) : (newService.price || 0),
        duration: typeof newService.duration === 'string' ? parseInt(newService.duration) : (newService.duration || 0),
        category_id: newService.category_id || "1aaa0000-0000-0000-0000-000000000001" // Используем ID категории "Диагностика" по умолчанию
      };

      // Логируем данные перед отправкой
      console.log('Создаем услугу с данными:', serviceToCreate);
      
      // Проверяем обязательные поля
      if (!serviceToCreate.name) {
        throw new Error('Название услуги обязательно');
      }
      if (serviceToCreate.price <= 0) {
        throw new Error('Цена должна быть больше нуля');
      }
      if (serviceToCreate.duration <= 0) {
        throw new Error('Длительность должна быть больше нуля');
      }
      
      // Явно указываем колонки для вставки
      const { data, error } = await supabase
        .from('services')
        .insert([{
          name: serviceToCreate.name,
          description: serviceToCreate.description,
          price: serviceToCreate.price,
          duration: serviceToCreate.duration,
          category_id: serviceToCreate.category_id
        }])
        .select();
      
      if (error) {
        console.error('Ошибка при создании услуги:', error);
        throw error;
      }
      
      console.log('Услуга успешно создана:', data);
      
      toast({
        title: "Успех",
        description: "Услуга успешно создана.",
      });
      
      setNewService({
        name: "",
        description: "",
        price: 0,
        duration: 0,
        category_id: "",
      });
      
      fetchServices();
    } catch (error: any) {
      console.error('Ошибка создания услуги:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать услугу. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    try {
      const { error } = await supabase
        .from('services')
        .update(editingService)
        .eq('id', editingService.id);
      
      if (error) throw error;
      
      toast({
        title: "Успех",
        description: "Услуга успешно обновлена.",
      });
      
      setEditingService(null);
      fetchServices();
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить услугу. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Успех",
        description: "Услуга успешно удалена.",
      });
      
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить услугу. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Управление услугами</h1>
        <p className="text-muted-foreground">
          Создавайте, удаляйте и редактируйте услуги
        </p>
      </div>

      {/* Форма создания новой услуги */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Создать новую услугу</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={newService.description || ""}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="price">Цена</Label>
              <Input
                id="price"
                type="number"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="duration">Длительность (минуты)</Label>
              <Input
                id="duration"
                type="number"
                value={newService.duration}
                onChange={(e) => setNewService({ ...newService, duration: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="category">Категория</Label>
              <Select
                value={newService.category_id}
                onValueChange={(value) => setNewService({ ...newService, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateService}>Создать услугу</Button>
          </div>
        </CardContent>
      </Card>

      {/* Список существующих услуг */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{service.name}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {service.description && (
                  <p className="text-muted-foreground mb-3">{service.description}</p>
                )}
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-muted-foreground">{formatCurrency(service.price)}</span>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingService(service)}
                    >
                      Редактировать
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(service.id)}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Модальное окно редактирования */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Редактировать услугу</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="edit-name">Название</Label>
                  <Input
                    id="edit-name"
                    value={editingService.name}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Описание</Label>
                  <Textarea
                    id="edit-description"
                    value={editingService.description || ""}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-price">Цена</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-duration">Длительность (минуты)</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    value={editingService.duration}
                    onChange={(e) => setEditingService({ ...editingService, duration: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Категория</Label>
                  <Select
                    value={editingService.category_id}
                    onValueChange={(value) => setEditingService({ ...editingService, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingService(null)}>
                    Отмена
                  </Button>
                  <Button onClick={handleUpdateService}>
                    Сохранить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminServices; 