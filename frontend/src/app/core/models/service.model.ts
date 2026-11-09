export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface TimeSlot {
  id: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "09:30"
  available: boolean;
  capacity?: number;
  bookedCount?: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  counterPrefix: string; // e.g. "MED", "DOC", "FIN", "PAS"
  defaultCounter: string; // e.g. "Counter 1"
  estimatedWaitMinutes: number;
  fee?: number;
  isActive: boolean;
  icon?: string;
  requirements?: string[];
  operatingHours?: {
    open: string;
    close: string;
    days: string[];
  };
  totalServedToday?: number;
}

export interface CreateServiceDto {
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  counterPrefix: string;
  defaultCounter: string;
  fee?: number;
  isActive: boolean;
  requirements?: string[];
}
