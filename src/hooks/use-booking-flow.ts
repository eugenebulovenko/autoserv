import { useState, useCallback } from "react";
import { BookingStep, CarInfo } from "@/types/booking";

interface UseBookingFlowProps {
  currentStep: BookingStep;
  setCurrentStep: (step: BookingStep) => void;
  date: Date | undefined;
  time: string | null;
  selectedServices: string[];
  carInfo: CarInfo;
  toast: any;
  handleSubmitBooking: () => Promise<void>;
}

export function useBookingFlow({
  currentStep,
  setCurrentStep,
  date,
  time,
  selectedServices,
  carInfo,
  toast,
  handleSubmitBooking
}: UseBookingFlowProps) {
  
  const validateCurrentStep = useCallback((): boolean => {
    if (currentStep === "date" && !date) {
      return false;
    }
    
    if (currentStep === "time" && !time) {
      return false;
    }
    
    if (currentStep === "service" && selectedServices.length === 0) {
      return false;
    }
    
    if (currentStep === "info") {
      if (!carInfo.make || !carInfo.model || !carInfo.year) {
        return false;
      }
    }
    
    return true;
  }, [currentStep, date, time, selectedServices, carInfo]);

  const showValidationError = useCallback(() => {
    if (currentStep === "date" && !date) {
      toast({
        description: "Пожалуйста, выберите дату для записи",
        variant: "destructive",
      });
    }
    
    if (currentStep === "time" && !time) {
      toast({
        description: "Пожалуйста, выберите удобное время",
        variant: "destructive",
      });
    }
    
    if (currentStep === "service" && selectedServices.length === 0) {
      toast({
        description: "Пожалуйста, выберите хотя бы одну услугу",
        variant: "destructive",
      });
    }
    
    if (currentStep === "info") {
      if (!carInfo.make || !carInfo.model || !carInfo.year) {
        toast({
          description: "Пожалуйста, укажите марку, модель и год выпуска автомобиля",
          variant: "destructive",
        });
      }
    }
  }, [currentStep, date, time, selectedServices, carInfo, toast]);

  const handleNextStep = useCallback(() => {
    if (!validateCurrentStep()) {
      showValidationError();
      return;
    }
    
    if (currentStep === "date") setCurrentStep("time");
    else if (currentStep === "time") setCurrentStep("service");
    else if (currentStep === "service") setCurrentStep("info");
    else if (currentStep === "info") setCurrentStep("confirm");
    else if (currentStep === "confirm") {
      handleSubmitBooking();
    }
  }, [currentStep, setCurrentStep, validateCurrentStep, showValidationError, handleSubmitBooking]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep === "time") setCurrentStep("date");
    else if (currentStep === "service") setCurrentStep("time");
    else if (currentStep === "info") setCurrentStep("service");
    else if (currentStep === "confirm") setCurrentStep("info");
  }, [currentStep, setCurrentStep]);

  return {
    handleNextStep,
    handlePreviousStep,
    validateCurrentStep
  };
}
