import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookingStep } from "@/types/booking";
import { useCallback, useState, useEffect } from "react";

interface BookingStepNavigationProps {
  currentStep: BookingStep;
  handlePreviousStep: () => void;
  handleNextStep: () => void;
  handleConfirm: () => Promise<void>;
  validateCurrentStep: () => boolean;
}

const BookingStepNavigation = ({
  currentStep,
  handlePreviousStep,
  handleNextStep,
  handleConfirm,
  validateCurrentStep
}: BookingStepNavigationProps) => {
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setIsValid(validateCurrentStep());
  }, [currentStep, validateCurrentStep]);

  const handleClick = useCallback(() => {
    if (currentStep === "confirm") {
      handleConfirm();
    } else {
      handleNextStep();
    }
  }, [currentStep, handleConfirm, handleNextStep]);

  return (
    <div className="flex justify-between">
      <Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      onClick={handlePreviousStep}
      disabled={currentStep === "date"}
      aria-label="Назад"
    >
      <ChevronLeft className="h-5 w-5" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Назад</TooltipContent>
</Tooltip>
      
      {currentStep === "confirm" ? (
  <Button
    onClick={handleClick}
    className="flex items-center gap-2"
    disabled={!isValid}
  >
    Записаться
  </Button>
) : (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        onClick={handleClick}
        variant="ghost"
        size="icon"
        disabled={!isValid}
        aria-label="Далее"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Далее</TooltipContent>
  </Tooltip>
)}
    </div>
  );
};

export default BookingStepNavigation;
