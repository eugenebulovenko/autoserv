
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Service } from "@/types/booking";
import { getTotalDuration, getTotalPrice } from "@/utils/bookingUtils";

interface ServiceSelectionProps {
  services: Service[];
  selectedServices: string[];
  handleServiceToggle: (serviceId: string) => void;
}

const ServiceSelection = ({ services, selectedServices, handleServiceToggle }: ServiceSelectionProps) => {
  return (
    <div className="animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Выберите услуги</h3>
      <div className="space-y-3 mb-4">
        {services.map((service) => (
          <Card 
            key={service.id} 
            className={`cursor-pointer transition-all hover:border-primary/60 ${
              selectedServices.includes(service.id) 
                ? "border-primary/80 bg-primary/5" 
                : ""
            }`}
            onClick={() => handleServiceToggle(service.id)}
          >
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h4 className="font-medium">{service.name}</h4>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{service.duration} мин.</span>
                </div>
              </div>
              <span className="font-medium">{service.price} ₽</span>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {selectedServices.length > 0 && (
        <div className="glass p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Общая длительность:</span>
            <span className="text-sm">{getTotalDuration(selectedServices, services)} мин.</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Предварительная стоимость:</span>
            <span className="font-medium">{getTotalPrice(selectedServices, services)} ₽</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceSelection;
