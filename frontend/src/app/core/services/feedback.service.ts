import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Feedback, FeedbackDto } from '../models/feedback.model';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

const INITIAL_FEEDBACKS: Feedback[] = [
  {
    id: 'fb-001',
    appointmentId: 'apt-003',
    userId: 'usr_001',
    userName: 'Sarah Jenkins',
    serviceId: 'srv-003',
    serviceName: 'Passport & Identity Verification',
    rating: 5,
    comment: 'Incredible experience! The digital token notified me exactly when to walk up to Counter 3. No standing in crowded lines.',
    waitSatisfaction: 'EXCELLENT',
    tags: ['Fast Service', 'Helpful Staff', 'Accurate Wait Time'],
    createdAt: '2026-02-10T11:45:00Z'
  },
  {
    id: 'fb-002',
    appointmentId: 'apt-102',
    userId: 'usr_004',
    userName: 'Jonathan Reed',
    serviceId: 'srv-001',
    serviceName: 'General Consultation & Health Check',
    rating: 4,
    comment: 'Doctor took ample time to listen to my symptoms. Wait time was within 5 minutes of what the dashboard predicted.',
    waitSatisfaction: 'GOOD',
    tags: ['Professional Doctor', 'Clean Facility'],
    createdAt: '2026-02-12T14:15:00Z'
  },
  {
    id: 'fb-003',
    appointmentId: 'apt-103',
    userId: 'usr_005',
    userName: 'Elena Rostova',
    serviceId: 'srv-004',
    serviceName: 'Wealth Management & Loan Advisory',
    rating: 5,
    comment: 'Smooth document processing and mortgage pre-approval advice. Clean digital appointment flow.',
    waitSatisfaction: 'EXCELLENT',
    tags: ['Fast Service', 'Expert Advice'],
    createdAt: '2026-02-14T16:00:00Z'
  }
];

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  private feedbacksSubject = new BehaviorSubject<Feedback[]>(INITIAL_FEEDBACKS);
  public feedbacks$ = this.feedbacksSubject.asObservable();

  submitFeedback(dto: FeedbackDto, serviceName?: string): Observable<Feedback> {
    const url = `${environment.apiUrl}/feedback`;
    return this.http.post<Feedback>(url, dto).pipe(
      tap(created => {
        const current = this.feedbacksSubject.value;
        this.feedbacksSubject.next([created, ...current]);
        this.toast.success('Thank you for rating your service experience!', 'Feedback Received');
      }),
      catchError(() => {
        const user = this.auth.currentUser;
        const newFeedback: Feedback = {
          id: 'fb-' + Math.random().toString(36).substring(2, 7),
          appointmentId: dto.appointmentId,
          userId: user?.id || 'usr_001',
          userName: user?.name || 'Valued Visitor',
          serviceId: dto.serviceId,
          serviceName: serviceName || 'General Service',
          rating: dto.rating,
          comment: dto.comment,
          waitSatisfaction: dto.waitSatisfaction,
          tags: dto.tags || ['Smooth Experience'],
          createdAt: new Date().toISOString()
        };

        const current = this.feedbacksSubject.value;
        this.feedbacksSubject.next([newFeedback, ...current]);
        this.toast.success('Thank you for your rating!', 'Feedback Saved');
        return of(newFeedback);
      })
    );
  }

  getAllFeedbacks(): Observable<Feedback[]> {
    const url = `${environment.apiUrl}/feedback`;
    return this.http.get<Feedback[]>(url).pipe(
      tap(list => {
        if (list && list.length) {
          this.feedbacksSubject.next(list);
        }
      }),
      catchError(() => of(this.feedbacksSubject.value))
    );
  }

  getServiceFeedbacks(serviceId: string): Observable<Feedback[]> {
    const url = `${environment.apiUrl}/feedback/service/${serviceId}`;
    return this.http.get<Feedback[]>(url).pipe(
      catchError(() => {
        const filtered = this.feedbacksSubject.value.filter(f => f.serviceId === serviceId);
        return of(filtered);
      })
    );
  }
}
