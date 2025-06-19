export interface QualityCheck {
  id: string;
  status: string;
  comments: string;
  check_date: string;
  work_order_id: string;
  checked_by: string;
}

export interface WorkOrder {
  id: string;
  order_number: string;
  status: string;
  mechanic_id: string;
  client_id: string;
  start_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  services: Array<{
    id: string;
    name: string;
    price: number;
    description?: string;
    duration?: number;
  }>;
  work_order_services?: Array<{
    id: string;
    service_id: string;
    services: {
      id: string;
      name: string;
      description?: string;
      price: number;
      duration?: number;
    };
  }>;
  quality_checks: QualityCheck[];
}
