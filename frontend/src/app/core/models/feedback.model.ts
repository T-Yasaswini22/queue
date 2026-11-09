export interface Feedback {
  id: string;
  appointmentId: string;
  userId: string;
  userName: string;
  serviceId: string;
  serviceName: string;
  rating: number; // 1 to 5
  comment: string;
  waitSatisfaction: 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT';
  tags?: string[];
  createdAt: string;
}

export interface FeedbackDto {
  appointmentId: string;
  serviceId: string;
  rating: number;
  comment: string;
  waitSatisfaction: 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT';
  tags?: string[];
}
