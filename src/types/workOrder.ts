export interface WorkOrderComment {
  id: string;
  work_order_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface WorkOrderStatus {
  id: string;
  work_order_id: string;
  status: string;
  mechanic_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: string;
  order_number: string;
  status: string;
  start_date: string | null;
  completion_date: string | null;
  total_cost: number | null;
  mechanic_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  appointment_id: string | null;
  vehicle_id: string | null;
  description: string | null;
  work_order_services?: { id: string; name: string; price: number }[];
  parts?: { id: string; name: string; price: number; quantity: number }[];
  repair_photos?: { id: string; photo_url: string; description: string | null }[];
  comments?: WorkOrderComment[];
}
