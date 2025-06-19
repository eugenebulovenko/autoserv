
import { Progress } from "@/components/ui/progress";
import { BookingStep } from "@/types/booking";
import { Check, CalendarDays, Clock, Wrench, Car, ClipboardCheck } from "lucide-react";

interface BookingStepIndicatorProps {
  currentStep: BookingStep;
}

const getProgressPercentage = (step: BookingStep): number => {
  switch (step) {
    case "date": return 0;
    case "time": return 25;
    case "service": return 50;
    case "info": return 75;
    case "confirm": return 100;
    default: return 0;
  }
};

const BookingStepIndicator = ({ currentStep }: BookingStepIndicatorProps) => {
  const progressPercentage = getProgressPercentage(currentStep);
  
  return (
    <div className="mb-8">
      <Progress value={progressPercentage} className="h-2 mb-4" />
      
      <div className="flex justify-between">
        <StepCircle 
          isActive={currentStep === "date"} 
          isCompleted={progressPercentage > 0}
          label="Дата"
          icon={<CalendarDays className="h-4 w-4" />}
        />
        
        <StepCircle 
          isActive={currentStep === "time"} 
          isCompleted={progressPercentage > 25}
          label="Время"
          icon={<Clock className="h-4 w-4" />}
        />
        
        <StepCircle 
          isActive={currentStep === "service"} 
          isCompleted={progressPercentage > 50}
          label="Услуги"
          icon={<Wrench className="h-4 w-4" />}
        />
        
        <StepCircle 
          isActive={currentStep === "info"} 
          isCompleted={progressPercentage > 75}
          label="Авто"
          icon={<Car className="h-4 w-4" />}
        />
        
        <StepCircle 
          isActive={currentStep === "confirm"} 
          isCompleted={progressPercentage === 100}
          label="Подтверждение"
          icon={<ClipboardCheck className="h-4 w-4" />}
        />
      </div>
    </div>
  );
};

interface StepCircleProps {
  isActive: boolean;
  isCompleted: boolean;
  label: string;
  icon: React.ReactNode;
}

const StepCircle = ({ isActive, isCompleted, label, icon }: StepCircleProps) => {
  return (
    <div className="flex flex-col items-center">
      <div 
        className={`
          flex items-center justify-center 
          w-10 h-10 rounded-full 
          transition-colors
          ${isActive ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' : ''}
          ${isCompleted && !isActive ? 'bg-primary/80 text-primary-foreground' : ''}
          ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
        `}
      >
        {isCompleted && !isActive ? <Check className="h-5 w-5" /> : icon}
      </div>
      <span className={`text-xs mt-1 ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
};

export default BookingStepIndicator;
