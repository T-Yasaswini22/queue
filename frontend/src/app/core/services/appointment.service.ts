import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Appointment, BookAppointmentDto, RescheduleDto, CancelAppointmentDto } from '../models/appointment.model';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-001',
    tokenNumber: 'MED-104',
    userId: 'usr_001',
    serviceId: 'srv-001',
    service: {
      id: 'srv-001',
      name: 'General Consultation & Health Check',
      description: 'Physical exam and primary healthcare',
      category: 'Healthcare',
      durationMinutes: 20,
      counterPrefix: 'MED',
      defaultCounter: 'Counter 1',
      estimatedWaitMinutes: 15,
      isActive: true
    },
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 10:30 AM',
    status: 'CALLED',
    counterAssigned: 'Counter 1',
    positionInQueue: 1,
    estimatedWaitMinutes: 2,
    reason: 'Follow-up on seasonal allergies and routine vitals assessment',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    calledAt: new Date(Date.now() - 120000).toISOString()
  },
  {
    id: 'apt-002',
    tokenNumber: 'DEN-208',
    userId: 'usr_001',
    serviceId: 'srv-002',
    service: {
      id: 'srv-002',
      name: 'Dental Care & Hygiene Screening',
      description: 'Teeth cleaning and orthodontic consultation',
      category: 'Healthcare',
      durationMinutes: 30,
      counterPrefix: 'DEN',
      defaultCounter: 'Counter 2',
      estimatedWaitMinutes: 25,
      isActive: true
    },
    appointmentDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    timeSlot: '02:00 PM - 02:30 PM',
    status: 'CONFIRMED',
    counterAssigned: 'Counter 2',
    positionInQueue: 4,
    estimatedWaitMinutes: 45,
    reason: 'Bi-annual teeth cleaning & polish',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'apt-003',
    tokenNumber: 'PAS-312',
    userId: 'usr_001',
    serviceId: 'srv-003',
    service: {
      id: 'srv-003',
      name: 'Passport & Identity Verification',
      description: 'Biometric capture and renewal',
      category: 'Government & Civil',
      durationMinutes: 15,
      counterPrefix: 'PAS',
      defaultCounter: 'Counter 3',
      estimatedWaitMinutes: 10,
      isActive: true
    },
    appointmentDate: '2026-02-10',
    timeSlot: '11:00 AM - 11:30 AM',
    status: 'COMPLETED',
    counterAssigned: 'Counter 3',
    positionInQueue: 0,
    estimatedWaitMinutes: 0,
    reason: '10-Year Biometric Passport Renewal',
    createdAt: '2026-02-05T09:00:00Z',
    completedAt: '2026-02-10T11:22:00Z',
    hasFeedback: true
  },
  {
    id: 'apt-004',
    tokenNumber: 'FIN-405',
    userId: 'usr_002',
    user: {
      id: 'usr_002',
      name: 'David Miller',
      email: 'david.m@example.com',
      role: 'USER',
      phone: '+1 (555) 345-6789'
    },
    serviceId: 'srv-004',
    service: {
      id: 'srv-004',
      name: 'Wealth Management & Loan Advisory',
      description: 'Retail mortgage advisory',
      category: 'Financial Services',
      durationMinutes: 35,
      counterPrefix: 'FIN',
      defaultCounter: 'Counter 4',
      estimatedWaitMinutes: 20,
      isActive: true
    },
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '11:30 AM - 12:00 PM',
    status: 'CONFIRMED',
    counterAssigned: 'Counter 4',
    positionInQueue: 2,
    estimatedWaitMinutes: 20,
    reason: 'Home mortgage refinancing evaluation',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'apt-005',
    tokenNumber: 'RTO-515',
    userId: 'usr_003',
    user: {
      id: 'usr_003',
      name: 'Emily Watson',
      email: 'emily.w@example.com',
      role: 'USER',
      phone: '+1 (555) 456-7890'
    },
    serviceId: 'srv-005',
    service: {
      id: 'srv-005',
      name: 'Driver License & Road Safety Certification',
      description: 'Biometric card renewal',
      category: 'Government & Civil',
      durationMinutes: 25,
      counterPrefix: 'RTO',
      defaultCounter: 'Counter 5',
      estimatedWaitMinutes: 30,
      isActive: true
    },
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '01:30 PM - 02:00 PM',
    status: 'IN_PROGRESS',
    counterAssigned: 'Counter 5',
    positionInQueue: 0,
    estimatedWaitMinutes: 0,
    reason: 'Commercial driver endorsement',
    createdAt: new Date(Date.now() - 10800000).toISOString()
  }
];

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  private appointmentsSubject = new BehaviorSubject<Appointment[]>(INITIAL_APPOINTMENTS);
  public appointments$ = this.appointmentsSubject.asObservable();

  getMyAppointments(): Observable<Appointment[]> {
    const user = this.auth.currentUser;
    const url = `${environment.apiUrl}/appointments/my`;
    return this.http.get<Appointment[]>(url).pipe(
      catchError(() => {
        // Fallback filter by logged in user ID
        const userId = user?.id || 'usr_001';
        const userApts = this.appointmentsSubject.value.filter(a => a.userId === userId);
        return of(userApts);
      })
    );
  }

  getAllAppointments(filter?: { status?: string; search?: string; date?: string }): Observable<Appointment[]> {
    const url = `${environment.apiUrl}/appointments`;
    return this.http.get<Appointment[]>(url).pipe(
      tap(apts => {
        if (apts && apts.length) {
          this.appointmentsSubject.next(apts);
        }
      }),
      catchError(() => of(this.appointmentsSubject.value)),
      map(list => {
        let result = [...list];
        if (filter?.status && filter.status !== 'ALL') {
          result = result.filter(a => a.status === filter.status);
        }
        if (filter?.date) {
          result = result.filter(a => a.appointmentDate === filter.date);
        }
        if (filter?.search && filter.search.trim()) {
          const q = filter.search.toLowerCase();
          result = result.filter(a =>
            a.tokenNumber.toLowerCase().includes(q) ||
            (a.service?.name && a.service.name.toLowerCase().includes(q)) ||
            (a.user?.name && a.user.name.toLowerCase().includes(q)) ||
            (a.reason && a.reason.toLowerCase().includes(q))
          );
        }
        return result;
      })
    );
  }

  getAppointmentById(id: string): Observable<Appointment | undefined> {
    const url = `${environment.apiUrl}/appointments/${id}`;
    return this.http.get<Appointment>(url).pipe(
      catchError(() => {
        const found = this.appointmentsSubject.value.find(a => a.id === id);
        return of(found);
      })
    );
  }

  bookAppointment(dto: BookAppointmentDto, serviceName?: string, prefix: string = 'QUE'): Observable<Appointment> {
    const url = `${environment.apiUrl}/appointments`;
    return this.http.post<Appointment>(url, dto).pipe(
      tap(created => {
        const current = this.appointmentsSubject.value;
        this.appointmentsSubject.next([created, ...current]);
        this.toast.success(`Token ${created.tokenNumber} issued successfully!`, 'Booking Confirmed');
      }),
      catchError(() => {
        const user = this.auth.currentUser;
        const randomNum = Math.floor(100 + Math.random() * 900);
        const tokenNumber = `${prefix}-${randomNum}`;
        const newApt: Appointment = {
          id: 'apt-' + Math.random().toString(36).substring(2, 8),
          tokenNumber: tokenNumber,
          userId: user?.id || 'usr_001',
          user: user || undefined,
          serviceId: dto.serviceId,
          service: {
            id: dto.serviceId,
            name: serviceName || 'Selected Service',
            description: '',
            category: 'General',
            durationMinutes: 20,
            counterPrefix: prefix,
            defaultCounter: 'Counter 1',
            estimatedWaitMinutes: 15,
            isActive: true
          },
          appointmentDate: dto.appointmentDate,
          timeSlot: dto.timeSlot,
          status: 'CONFIRMED',
          counterAssigned: 'Counter 1',
          positionInQueue: 3,
          estimatedWaitMinutes: 25,
          reason: dto.reason || 'General Appointment',
          notes: dto.notes,
          createdAt: new Date().toISOString()
        };

        const current = this.appointmentsSubject.value;
        this.appointmentsSubject.next([newApt, ...current]);
        this.toast.success(`Token ${newApt.tokenNumber} issued!`, 'Appointment Confirmed');
        return of(newApt);
      })
    );
  }

  rescheduleAppointment(id: string, dto: RescheduleDto): Observable<Appointment> {
    const url = `${environment.apiUrl}/appointments/${id}/reschedule`;
    return this.http.put<Appointment>(url, dto).pipe(
      tap(updated => {
        this.updateLocalAppointment(updated);
        this.toast.success(`Appointment rescheduled to ${dto.appointmentDate} at ${dto.timeSlot}`);
      }),
      catchError(() => {
        const apt = this.appointmentsSubject.value.find(a => a.id === id);
        if (apt) {
          const updated: Appointment = {
            ...apt,
            appointmentDate: dto.appointmentDate,
            timeSlot: dto.timeSlot,
            updatedAt: new Date().toISOString()
          };
          this.updateLocalAppointment(updated);
          this.toast.success(`Rescheduled to ${dto.appointmentDate} (${dto.timeSlot})`, 'Appointment Updated');
          return of(updated);
        }
        return of(apt!);
      })
    );
  }

  cancelAppointment(id: string, dto: CancelAppointmentDto): Observable<Appointment> {
    const url = `${environment.apiUrl}/appointments/${id}/cancel`;
    return this.http.put<Appointment>(url, dto).pipe(
      tap(cancelled => {
        this.updateLocalAppointment(cancelled);
        this.toast.warning(`Appointment ${cancelled.tokenNumber} cancelled.`);
      }),
      catchError(() => {
        const apt = this.appointmentsSubject.value.find(a => a.id === id);
        if (apt) {
          const updated: Appointment = {
            ...apt,
            status: 'CANCELLED',
            cancelledAt: new Date().toISOString(),
            cancellationReason: dto.cancellationReason
          };
          this.updateLocalAppointment(updated);
          this.toast.warning(`Appointment ${apt.tokenNumber} cancelled.`);
          return of(updated);
        }
        return of(apt!);
      })
    );
  }

  private updateLocalAppointment(apt: Appointment): void {
    const list = this.appointmentsSubject.value.map(a => a.id === apt.id ? apt : a);
    this.appointmentsSubject.next(list);
  }
}
