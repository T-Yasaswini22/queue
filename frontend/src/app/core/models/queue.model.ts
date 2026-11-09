import { Appointment } from './appointment.model';

export type TokenStatus = 'WAITING' | 'CALLED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'NO_SHOW';

export interface QueueToken {
  id: string;
  tokenNumber: string;
  appointmentId: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerPhone?: string;
  counterAssigned: string;
  status: TokenStatus;
  positionInQueue: number;
  timeSlot?: string;
  estimatedWaitMinutes: number;
  calledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface LiveQueueState {
  serviceId?: string;
  serviceName?: string;
  currentServingToken?: QueueToken | null;
  lastCalledToken?: QueueToken | null;
  waitingTokens: QueueToken[];
  completedTokensCount: number;
  totalWaitingCount: number;
  averageWaitTimeMinutes: number;
  activeCounters: string[];
  lastUpdated: string;
}

export interface TokenActionDto {
  tokenId: string;
  action: 'CALL_NEXT' | 'RECALL' | 'START' | 'COMPLETE' | 'SKIP' | 'NO_SHOW';
  counterName?: string;
  notes?: string;
}
