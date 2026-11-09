export interface DailyStat {
  date: string;
  totalAppointments: number;
  completed: number;
  cancelled: number;
  noShow: number;
  avgWaitMinutes: number;
}

export interface ServicePerformance {
  serviceId: string;
  serviceName: string;
  appointmentsCount: number;
  avgWaitMinutes: number;
  satisfactionRating: number;
}

export interface StaffPerformance {
  staffId: string;
  staffName: string;
  counterName: string;
  tokensServed: number;
  avgServiceMinutes: number;
  activeHours: number;
}

export interface AnalyticsReport {
  summary: {
    totalAppointments: number;
    todayAppointments: number;
    currentlyWaiting: number;
    completedToday: number;
    cancelledToday: number;
    averageWaitTimeMinutes: number;
    satisfactionScore: number;
    activeCountersCount: number;
  };
  dailyTrend: DailyStat[];
  servicePerformance: ServicePerformance[];
  staffPerformance: StaffPerformance[];
}
