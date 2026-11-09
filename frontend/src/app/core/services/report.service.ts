import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AnalyticsReport } from '../models/report.model';
import { ToastService } from './toast.service';

const MOCK_ANALYTICS: AnalyticsReport = {
  summary: {
    totalAppointments: 1248,
    todayAppointments: 86,
    currentlyWaiting: 4,
    completedToday: 74,
    cancelledToday: 3,
    averageWaitTimeMinutes: 13.5,
    satisfactionScore: 4.8,
    activeCountersCount: 6
  },
  dailyTrend: [
    { date: 'Mon', totalAppointments: 78, completed: 72, cancelled: 4, noShow: 2, avgWaitMinutes: 14 },
    { date: 'Tue', totalAppointments: 92, completed: 86, cancelled: 3, noShow: 3, avgWaitMinutes: 12 },
    { date: 'Wed', totalAppointments: 84, completed: 79, cancelled: 2, noShow: 3, avgWaitMinutes: 15 },
    { date: 'Thu', totalAppointments: 95, completed: 89, cancelled: 4, noShow: 2, avgWaitMinutes: 11 },
    { date: 'Fri', totalAppointments: 110, completed: 104, cancelled: 3, noShow: 3, avgWaitMinutes: 16 },
    { date: 'Sat', totalAppointments: 65, completed: 62, cancelled: 2, noShow: 1, avgWaitMinutes: 10 },
    { date: 'Sun', totalAppointments: 40, completed: 38, cancelled: 1, noShow: 1, avgWaitMinutes: 9 }
  ],
  servicePerformance: [
    { serviceId: 'srv-001', serviceName: 'General Consultation', appointmentsCount: 380, avgWaitMinutes: 14, satisfactionRating: 4.7 },
    { serviceId: 'srv-002', serviceName: 'Dental Care & Screening', appointmentsCount: 220, avgWaitMinutes: 18, satisfactionRating: 4.9 },
    { serviceId: 'srv-003', serviceName: 'Passport & Identity', appointmentsCount: 310, avgWaitMinutes: 9, satisfactionRating: 4.8 },
    { serviceId: 'srv-004', serviceName: 'Wealth Management', appointmentsCount: 145, avgWaitMinutes: 15, satisfactionRating: 4.6 },
    { serviceId: 'srv-005', serviceName: 'Driver License Endorsement', appointmentsCount: 193, avgWaitMinutes: 22, satisfactionRating: 4.5 }
  ],
  staffPerformance: [
    { staffId: 'stf-001', staffName: 'Dr. Michael Chen', counterName: 'Counter 1', tokensServed: 38, avgServiceMinutes: 18, activeHours: 6.5 },
    { staffId: 'stf-002', staffName: 'Dr. Sarah Lin', counterName: 'Counter 2', tokensServed: 24, avgServiceMinutes: 25, activeHours: 6.0 },
    { staffId: 'stf-003', staffName: 'Officer Marcus Bell', counterName: 'Counter 3', tokensServed: 46, avgServiceMinutes: 11, activeHours: 7.0 },
    { staffId: 'stf-004', staffName: 'Advisor Priya Sharma', counterName: 'Counter 4', tokensServed: 19, avgServiceMinutes: 30, activeHours: 6.5 }
  ]
};

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  getAnalyticsReport(): Observable<AnalyticsReport> {
    const url = `${environment.apiUrl}/reports/analytics`;
    return this.http.get<AnalyticsReport>(url).pipe(
      catchError(() => of(MOCK_ANALYTICS))
    );
  }

  exportReportCsv(): void {
    const rows = [
      ['Metric', 'Value'],
      ['Total Appointments (All-time)', MOCK_ANALYTICS.summary.totalAppointments],
      ['Today Appointments', MOCK_ANALYTICS.summary.todayAppointments],
      ['Currently Waiting', MOCK_ANALYTICS.summary.currentlyWaiting],
      ['Completed Today', MOCK_ANALYTICS.summary.completedToday],
      ['Average Wait Time (Mins)', MOCK_ANALYTICS.summary.averageWaitTimeMinutes],
      ['Satisfaction Rating (/5)', MOCK_ANALYTICS.summary.satisfactionScore],
      [],
      ['Day', 'Total', 'Completed', 'Cancelled', 'Avg Wait (Mins)'],
      ...MOCK_ANALYTICS.dailyTrend.map(d => [d.date, d.totalAppointments, d.completed, d.cancelled, d.avgWaitMinutes]),
      [],
      ['Service Name', 'Total Bookings', 'Avg Wait (Mins)', 'Rating'],
      ...MOCK_ANALYTICS.servicePerformance.map(s => [s.serviceName, s.appointmentsCount, s.avgWaitMinutes, s.satisfactionRating])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `queueless_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toast.success('Analytics report CSV generated and downloaded!');
  }
}
