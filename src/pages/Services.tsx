import MainLayout from "@/layouts/MainLayout";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Wrench, ChevronRight, AlertCircle, Car } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    vin: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
    fetchVehicles();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories first
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('id, name');
      
      if (categoriesError) throw categoriesError;

      const categoriesMap: {[key: string]: string} = {};
      if (categoriesData) {
        categoriesData.forEach((category: { id: string; name: string }) => {
          categoriesMap[category.id] = category.name;
        });
      }
      setCategories(categoriesMap);

      // Fetch services
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const servicesWithCategories = data.map((service: Service) => ({
          ...service,
          category_name: categoriesMap[service.category_id] || 'Основные услуги'
        }));
        setServices(servicesWithCategories);
      }
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

  const fetchVehicles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список автомобилей. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    if (vehicles.length === 0) {
      setShowVehicleDialog(true);
    } else {
      navigate(`/booking?service=${service.id}&vehicle=${vehicles[0].id}`);
    }
  };

  const handleAddVehicle = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { error } = await supabase
        .from('vehicles')
        .insert([{ ...newVehicle, user_id: user.id }]);
      
      if (error) throw error;
      
      toast({
        title: "Успех",
        description: "Автомобиль успешно добавлен.",
      });
      
      setShowVehicleDialog(false);
      setNewVehicle({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        vin: "",
      });
      
      fetchVehicles();
      
      if (selectedService) {
        navigate(`/booking?service=${selectedService.id}&vehicle=${vehicles[0].id}`);
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить автомобиль. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    }
  };

  // Group services by category
  const servicesByCategory: {[key: string]: Service[]} = {};
  services.forEach(service => {
    const categoryName = service.category_name || 'Основные услуги';
    if (!servicesByCategory[categoryName]) {
      servicesByCategory[categoryName] = [];
    }
    servicesByCategory[categoryName].push(service);
  });

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-3">Наши услуги</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Полный спектр услуг по обслуживанию и ремонту автомобилей от наших опытных специалистов
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Услуги временно недоступны</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.keys(servicesByCategory).map((categoryName) => (
                <div key={categoryName}>
                  <h2 className="text-2xl font-semibold mb-4 border-l-4 border-primary pl-3">{categoryName}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servicesByCategory[categoryName].map((service) => (
                      <Card key={service.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                          {service.description && (
                            <CardDescription className="mb-3 line-clamp-2">
                              {service.description}
                            </CardDescription>
                          )}
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{service.duration} мин.</span>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                              {formatCurrency(service.price)}
                            </Badge>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Button 
                            className="w-full"
                            onClick={() => handleServiceSelect(service)}
                          >
                            Записаться <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-16 text-center">
            <Button size="lg" asChild>
              <Link to="/booking" className="flex items-center px-6">
                <Wrench className="mr-2 h-5 w-5" /> Записаться на сервис
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Диалог добавления автомобиля */}
      <Dialog open={showVehicleDialog} onOpenChange={setShowVehicleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить автомобиль</DialogTitle>
            <DialogDescription>
              Для записи на услугу необходимо добавить автомобиль
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="make">Марка</Label>
              <Input
                id="make"
                value={newVehicle.make}
                onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="model">Модель</Label>
              <Input
                id="model"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="year">Год выпуска</Label>
              <Input
                id="year"
                type="number"
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({ ...newVehicle, year: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="vin">VIN-номер</Label>
              <Input
                id="vin"
                value={newVehicle.vin}
                onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVehicleDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddVehicle}>
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Services;
