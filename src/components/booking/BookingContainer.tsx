import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { BookingStep, CarInfo } from "@/types/booking";
import { calculateEndTime, getTotalDuration, getTotalPrice } from "@/utils/bookingUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

// Import Step Components
import DateSelection from "@/components/booking/DateSelection";
import TimeSelection from "@/components/booking/TimeSelection";
import ServiceSelection from "@/components/booking/ServiceSelection";
import CarInfoForm from "@/components/booking/CarInfoForm";
import BookingConfirmation from "@/components/booking/BookingConfirmation";
import BookingStepNavigation from "@/components/booking/BookingStepNavigation";
import BookingStepIndicator from "@/components/booking/BookingStepIndicator";
import { useBookingFlow } from "@/hooks/use-booking-flow";

const BookingContainer = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [services, setServices] = useState<any[]>([]); // услуги из базы
  const [currentStep, setCurrentStep] = useState<BookingStep>("date");
  const [carInfo, setCarInfo] = useState<CarInfo>({
    make: "",
    model: "",
    year: "",
    vin: ""
  });
  const [userVehicles, setUserVehicles] = useState<any[]>([]); // список авто пользователя
  const [loadingVehicles, setLoadingVehicles] = useState<boolean>(false); // состояние загрузки авто

  // Получаем актуальные услуги из базы при монтировании
  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase.from('services').select('*').order('name');
      if (!error && data) setServices(data);
    };
    fetchServices();
  }, []);

  // Get service ID from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const serviceId = params.get('service');
    if (serviceId) {
      setSelectedServices([serviceId]);
      setCurrentStep("date");
    }
  }, []);

  const handleServiceToggle = useCallback((serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  }, []);

  const handleCarInfoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCarInfo(prev => ({ ...prev, [name]: value }));
  }, []);

  // Выбор автомобиля из гаража пользователя
  const handleSelectVehicle = useCallback((vehicle: any) => {
    setCarInfo({
      make: vehicle.brand || vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year ? String(vehicle.year) : '',
      vin: vehicle.vin || ''
    });
  }, []);

  const handleSubmitBooking = useCallback(async () => {
    try {
      if (!date || !time || selectedServices.length === 0) {
        toast({
          description: "Пожалуйста, заполните все необходимые поля",
          variant: "destructive",
        });
        return;
      }

      // Получаем актуальный список услуг из базы данных
      const { data: actualServices, error: servicesFetchError } = await supabase
        .from('services')
        .select('id');
      if (servicesFetchError) {
        toast({
          description: "Не удалось проверить услуги. Попробуйте ещё раз.",
          variant: "destructive",
        });
        return;
      }
      const actualServiceIds = (actualServices || []).map((s: { id: string }) => s.id);
      const invalidServiceIds = selectedServices.filter(
        serviceId => !actualServiceIds.includes(serviceId)
      );
      if (invalidServiceIds.length > 0) {
        toast({
          description: `Некоторые выбранные услуги не существуют. Пожалуйста, выберите услуги из списка заново.`,
          variant: "destructive",
        });
        setSelectedServices([]);
        setCurrentStep("service");
        return;
      }

      // Получить текущего аутентифицированного пользователя
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          description: "Пожалуйста, войдите в систему чтобы записаться на сервис",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // Сначала создать или получить автомобиль для этого пользователя
      let vehicleId: string;
      
      // Проверить, существует ли автомобиль
      const { data: existingVehicles, error: vehicleCheckError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('user_id', user.id)
        .eq('make', carInfo.make)
        .eq('model', carInfo.model)
        .eq('year', Number(carInfo.year))
        .maybeSingle();

      if (vehicleCheckError) throw vehicleCheckError;

      if (existingVehicles?.id) {
        vehicleId = existingVehicles.id;
      } else {
        // Создать новый автомобиль
        const { data: newVehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .insert({
            user_id: user.id,
            make: carInfo.make,
            model: carInfo.model,
            year: Number(carInfo.year),
            vin: carInfo.vin || null
          })
          .select('id')
          .single();

        if (vehicleError) throw vehicleError;
        vehicleId = newVehicle.id;
      }

      // Используем только актуальные услуги из базы для расчёта
      const selectedActualServices = (actualServices || []).filter((s: { id: string }) => selectedServices.includes(s.id));
      // Для расчёта цены и длительности нужны price и duration, поэтому запрашиваем их из базы:
      // Если actualServices содержит только id, делаем дополнительный запрос
      let fullActualServices = actualServices;
      if (actualServices && actualServices.length > 0 && !('price' in actualServices[0])) {
        const { data: fullData, error: fullError } = await supabase
          .from('services')
          .select('id, price, duration')
          .in('id', selectedServices);
        if (fullError) {
          toast({
            description: "Не удалось получить данные по услугам. Попробуйте ещё раз.",
            variant: "destructive",
          });
          return;
        }
        fullActualServices = fullData;
      }
      const selectedFullActualServices = (fullActualServices || []).filter((s: { id: string }) => selectedServices.includes(s.id));

      // Рассчитать общую длительность
      const totalDuration = selectedFullActualServices.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);

      // Рассчитать итоговую стоимость
      const totalPrice = selectedFullActualServices.reduce((sum: number, s: any) => sum + (s.price || 0), 0);

      // Создать запись на сервис
      const appointmentDate = new Date(date);
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          vehicle_id: vehicleId,
          appointment_date: appointmentDate.toISOString().split('T')[0],
          start_time: time,
          end_time: calculateEndTime(time, totalDuration),
          total_price: totalPrice,
          status: 'pending'
        })
        .select('id')
        .single();

      if (appointmentError) throw appointmentError;

      // Создать appointment services только для актуальных услуг
      const appointmentServices = selectedFullActualServices.map((service: any) => ({
        appointment_id: appointment.id,
        service_id: service.id,
        price: service.price || 0
      }));

      const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(appointmentServices);

      if (servicesError) throw servicesError;

      // Показать сообщение об успешной записи
      toast({
        description: `Вы успешно записаны на ${appointmentDate.toLocaleDateString('ru-RU')} в ${time}`,
      });
      
      // Сбросить форму
      setDate(undefined);
      setTime(null);
      setSelectedServices([]);
      setCurrentStep("date");
      setCarInfo({ make: "", model: "", year: "", vin: "" });
      
      // Перенаправить на дашборд
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        description: "Не удалось создать запись. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    }
  }, [date, time, selectedServices, carInfo, toast, navigate]);

  const { 
    handleNextStep,
    handlePreviousStep,
    validateCurrentStep
  } = useBookingFlow({
    currentStep,
    setCurrentStep,
    date,
    time,
    selectedServices,
    carInfo,
    toast,
    handleSubmitBooking
  });

  // Загрузка автомобилей пользователя при переходе на шаг info
  useEffect(() => {
    if (currentStep === 'info') {
      setLoadingVehicles(true);
      (async () => {
        // Получить текущего пользователя
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Получить автомобили пользователя
          const { data: vehicles } = await supabase
            .from('vehicles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          setUserVehicles(vehicles || []);
        }
        setLoadingVehicles(false);
      })();
    }
  }, [currentStep]);

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case "date":
        return <DateSelection date={date} setDate={setDate} />;
      case "time":
        return <TimeSelection date={date} time={time} setTime={setTime} />;
      case "service":
        return (
          <ServiceSelection 
            services={services} 
            selectedServices={selectedServices} 
            handleServiceToggle={handleServiceToggle} 
          />
        );
      case "info":
        return (
          <CarInfoForm 
            carInfo={carInfo} 
            handleCarInfoChange={handleCarInfoChange}
            vehicles={userVehicles}
            onSelectVehicle={handleSelectVehicle}
            loadingVehicles={loadingVehicles}
          />
        );
      case "confirm":
        return (
          <BookingConfirmation 
            date={date} 
            time={time} 
            carInfo={carInfo}
            selectedServices={selectedServices} 
            services={services}
          />
        );
      default:
        return null;
    }
  }, [currentStep, date, time, selectedServices, carInfo, handleServiceToggle, handleCarInfoChange, services]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Запись на сервис</CardTitle>
      </CardHeader>
      <CardContent>
        <BookingStepIndicator currentStep={currentStep} />
        {renderStepContent()}
        <BookingStepNavigation
          currentStep={currentStep}
          handlePreviousStep={handlePreviousStep}
          handleNextStep={handleNextStep}
          handleConfirm={handleSubmitBooking}
          validateCurrentStep={validateCurrentStep}
        />
      </CardContent>
    </Card>
  );
};

export default BookingContainer;
