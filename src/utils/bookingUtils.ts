import { Service } from "@/types/booking";

export const calculateEndTime = (startTime: string, durationMinutes: number) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
};

export const isDisabledDate = (date: Date) => {
  // Отключить прошлые даты
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Отключить выходные
  const day = date.getDay();
  const isSunday = day === 0;
  
  return date < today || isSunday;
};

export const getTotalDuration = (selectedServices: string[], services: Service[]) => {
  return selectedServices.reduce((total, id) => {
    const service = services.find(s => s.id === id);
    return total + (service?.duration || 0);
  }, 0);
};

export const getTotalPrice = (selectedServices: string[], services: Service[]) => {
  return selectedServices.reduce((total, id) => {
    const service = services.find(s => s.id === id);
    return total + (service?.price || 0);
  }, 0);
};
