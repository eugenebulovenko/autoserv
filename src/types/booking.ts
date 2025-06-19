export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export interface CarInfo {
  make: string;
  model: string;
  year: string; // Оставлено строкой для формы, но при сохранении в БД преобразуется в число
  vin: string;
}

export type BookingStep = "date" | "time" | "service" | "info" | "confirm";

export const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

export interface Review {
  id: string;
  workOrderId: string;
  rating: number; // 1-5 звёзд
  comment?: string;
  createdAt: string;
}

export interface WorkOrderStatus {
  id: string;
  workOrderId: string;
  status: string;
  comment?: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

export interface RepairPhoto {
  id: string;
  url: string;
  description?: string;
  createdAt: string;
}

export type PaymentMethod = "online" | "cash" | "card";

