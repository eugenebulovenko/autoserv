import { CarInfo, Service } from "@/types/booking";
import { CalendarIcon, Clock, CarFront, Wrench } from "lucide-react";
import { getTotalDuration, getTotalPrice } from "@/utils/bookingUtils";
import { formatCurrency } from "@/lib/utils";

interface BookingConfirmationProps {
  date: Date | undefined;
  time: string | null;
  carInfo: CarInfo;
  selectedServices: string[];
  services: Service[];
}

const BookingConfirmation = ({ date, time, carInfo, selectedServices, services }: BookingConfirmationProps) => {
  return (
    <div className="animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Подтверждение записи</h3>
      <div className="glass rounded-lg p-4 mb-4">
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Дата:</span>
            <span className="font-medium">{date?.toLocaleDateString('ru-RU')}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Время:</span>
            <span className="font-medium">{time}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CarFront className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Автомобиль:</span>
            <span className="font-medium">{carInfo.make} {carInfo.model} ({carInfo.year})</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          Выбранные услуги:
        </h4>
        
        {selectedServices.map((serviceId) => {
          const service = services.find(s => s.id === serviceId);
          return (
            <div key={serviceId} className="flex justify-between text-sm">
              <span>{service?.name}</span>
              <span className="font-medium">{service ? formatCurrency(service.price) : ''}</span>
            </div>
          );
        })}
        
        <div className="pt-3 mt-3 border-t border-border">
          <div className="flex justify-between">
            <span className="font-medium">Итого:</span>
            <span className="font-bold">{formatCurrency(getTotalPrice(selectedServices, services))}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Общая длительность: {getTotalDuration(selectedServices, services)} мин.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
