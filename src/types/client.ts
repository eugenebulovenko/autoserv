export interface Client {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  clientId: string;
  brand: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceHistory {
  id: string;
  vehicleId: string;
  serviceDate: Date;
  serviceType: string;
  description: string;
  cost: number;
  status: 'completed' | 'in_progress' | 'scheduled';
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyOffer {
  id: string;
  clientId: string;
  title: string;
  description: string;
  pointsRequired: number;
  discount: number;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
} 