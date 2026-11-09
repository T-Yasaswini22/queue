import { Service } from './service.model';
import { User } from './user.model';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CALLED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Appointment {
  id: string;
  tokenNumber: string; // e.g. "MED-104"
  userId: string;
  user?: User;
  serviceId: string;
  service?: Service;
  appointmentDate: string; // "YYYY-MM-DD"
  timeSlot: string;        // "09:30 AM"
  status: AppointmentStatus;
  counterAssigned?: string;
  positionInQueue?: number;
  estimatedWaitMinutes?: number;
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  calledAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  hasFeedback?: boolean;
}

export interface BookAppointmentDto {
  serviceId: string;
  appointmentDate: string;
  timeSlot: string;
  reason?: string;
  notes?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface RescheduleDto {
  appointmentDate: string;
  timeSlot: string;
  reason?: string;
}

export interface CancelAppointmentDto {
  cancellationReason: string;
}
