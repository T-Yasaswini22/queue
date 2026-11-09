import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LiveQueueState, QueueToken, TokenActionDto } from '../models/queue.model';
import { ToastService } from './toast.service';

const INITIAL_QUEUE_STATE: LiveQueueState = {
  currentServingToken: {
    id: 'tok-001',
    tokenNumber: 'MED-104',
    appointmentId: 'apt-001',
    serviceId: 'srv-001',
    serviceName: 'General Consultation & Health Check',
    customerName: 'Sarah Jenkins',
    customerPhone: '+1 (555) 234-5678',
    counterAssigned: 'Counter 1',
    status: 'CALLED',
    positionInQueue: 1,
    timeSlot: '10:00 AM',
    estimatedWaitMinutes: 0,
    calledAt: new Date(Date.now() - 90000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  lastCalledToken: {
    id: 'tok-000',
    tokenNumber: 'MED-103',
    appointmentId: 'apt-000',
    serviceId: 'srv-001',
    serviceName: 'General Consultation & Health Check',
    customerName: 'James Henderson',
    counterAssigned: 'Counter 1',
    status: 'COMPLETED',
    positionInQueue: 0,
    timeSlot: '09:30 AM',
    estimatedWaitMinutes: 0,
    completedAt: new Date(Date.now() - 300000).toISOString(),
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  waitingTokens: [
    {
      id: 'tok-002',
      tokenNumber: 'MED-105',
      appointmentId: 'apt-105',
      serviceId: 'srv-001',
      serviceName: 'General Consultation & Health Check',
      customerName: 'Robert Vance',
      customerPhone: '+1 (555) 888-1122',
      counterAssigned: 'Counter 1',
      status: 'WAITING',
      positionInQueue: 1,
      timeSlot: '10:30 AM',
      estimatedWaitMinutes: 12,
      createdAt: new Date(Date.now() - 2400000).toISOString()
    },
    {
      id: 'tok-003',
      tokenNumber: 'DEN-209',
      appointmentId: 'apt-209',
      serviceId: 'srv-002',
      serviceName: 'Dental Care & Hygiene Screening',
      customerName: 'Alice Wong',
      counterAssigned: 'Counter 2',
      status: 'WAITING',
      positionInQueue: 2,
      timeSlot: '10:45 AM',
      estimatedWaitMinutes: 24,
      createdAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'tok-004',
      tokenNumber: 'PAS-314',
      appointmentId: 'apt-314',
      serviceId: 'srv-003',
      serviceName: 'Passport & Identity Verification',
      customerName: 'David Lee',
      counterAssigned: 'Counter 3',
      status: 'WAITING',
      positionInQueue: 3,
      timeSlot: '11:00 AM',
      estimatedWaitMinutes: 35,
      createdAt: new Date(Date.now() - 1200000).toISOString()
    },
    {
      id: 'tok-005',
      tokenNumber: 'FIN-406',
      appointmentId: 'apt-406',
      serviceId: 'srv-004',
      serviceName: 'Wealth Management & Loan Advisory',
      customerName: 'Maria Garcia',
      counterAssigned: 'Counter 4',
      status: 'WAITING',
      positionInQueue: 4,
      estimatedWaitMinutes: 48,
      createdAt: new Date(Date.now() - 600000).toISOString()
    }
  ],
  completedTokensCount: 42,
  totalWaitingCount: 4,
  averageWaitTimeMinutes: 14,
  activeCounters: ['Counter 1 (Dr. Chen)', 'Counter 2 (Dental)', 'Counter 3 (Passports)', 'Counter 4 (Finance)'],
  lastUpdated: new Date().toISOString()
};

@Injectable({
  providedIn: 'root'
})
export class QueueService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  private queueStateSubject = new BehaviorSubject<LiveQueueState>(INITIAL_QUEUE_STATE);
  public queueState$ = this.queueStateSubject.asObservable();

  getLiveQueueState(serviceId?: string): Observable<LiveQueueState> {
    const query = serviceId ? `?serviceId=${serviceId}` : '';
    const url = `${environment.apiUrl}/queue/live${query}`;
    return this.http.get<LiveQueueState>(url).pipe(
      tap(state => {
        if (state) {
          this.queueStateSubject.next(state);
        }
      }),
      catchError(() => {
        const state = { ...this.queueStateSubject.value, lastUpdated: new Date().toISOString() };
        this.queueStateSubject.next(state);
        return of(state);
      })
    );
  }

  callNextToken(counterName: string = 'Counter 1'): Observable<QueueToken | null> {
    const url = `${environment.apiUrl}/queue/next`;
    return this.http.post<QueueToken>(url, { counterName }).pipe(
      tap(nextTok => {
        this.applyCallNextLocally(counterName);
        this.playChime();
        this.toast.info(`Calling token ${nextTok.tokenNumber} to ${counterName}`, 'Now Serving');
      }),
      catchError(() => {
        const nextTok = this.applyCallNextLocally(counterName);
        if (nextTok) {
          this.playChime();
          this.toast.info(`Calling token ${nextTok.tokenNumber} to ${counterName}`, 'Now Serving');
        } else {
          this.toast.warning('No more waiting tokens in the queue!', 'Queue Empty');
        }
        return of(nextTok);
      })
    );
  }

  recallCurrentToken(): void {
    const current = this.queueStateSubject.value.currentServingToken;
    if (current) {
      this.playChime();
      this.toast.info(`Re-calling Token ${current.tokenNumber} to ${current.counterAssigned}`, 'Attention Alert');
    } else {
      this.toast.warning('No active token currently called to recall.');
    }
  }

  startService(): Observable<boolean> {
    const state = this.queueStateSubject.value;
    if (!state.currentServingToken) {
      this.toast.warning('Please call a token first.');
      return of(false);
    }
    const current = { ...state.currentServingToken, status: 'IN_PROGRESS' as const, startedAt: new Date().toISOString() };
    this.queueStateSubject.next({ ...state, currentServingToken: current });
    this.toast.success(`Service started for Token ${current.tokenNumber}`);
    return of(true);
  }

  completeService(): Observable<boolean> {
    const state = this.queueStateSubject.value;
    if (!state.currentServingToken) {
      this.toast.warning('No token currently being served to complete.');
      return of(false);
    }
    const finishedToken = {
      ...state.currentServingToken,
      status: 'COMPLETED' as const,
      completedAt: new Date().toISOString()
    };
    this.queueStateSubject.next({
      ...state,
      currentServingToken: null,
      lastCalledToken: finishedToken,
      completedTokensCount: state.completedTokensCount + 1,
      lastUpdated: new Date().toISOString()
    });
    this.toast.success(`Token ${finishedToken.tokenNumber} completed successfully!`, 'Service Complete');
    return of(true);
  }

  skipToken(tokenId: string, reason: string = 'Customer unavailable'): Observable<boolean> {
    const state = this.queueStateSubject.value;
    let newWaiting = state.waitingTokens.filter(t => t.id !== tokenId);
    let currentServing = state.currentServingToken;

    if (currentServing && currentServing.id === tokenId) {
      currentServing = null;
    }

    // Re-index remaining positions
    newWaiting = newWaiting.map((t, idx) => ({
      ...t,
      positionInQueue: idx + 1,
      estimatedWaitMinutes: (idx + 1) * 12
    }));

    this.queueStateSubject.next({
      ...state,
      currentServingToken: currentServing,
      waitingTokens: newWaiting,
      totalWaitingCount: newWaiting.length,
      lastUpdated: new Date().toISOString()
    });

    this.toast.warning(`Token marked as skipped (${reason})`, 'Token Skipped');
    return of(true);
  }

  markNoShow(tokenId: string): Observable<boolean> {
    return this.skipToken(tokenId, 'Customer did not show up');
  }

  private applyCallNextLocally(counterName: string): QueueToken | null {
    const state = this.queueStateSubject.value;
    if (state.waitingTokens.length === 0) {
      return null;
    }

    const nextToken = { ...state.waitingTokens[0] };
    nextToken.status = 'CALLED';
    nextToken.counterAssigned = counterName;
    nextToken.calledAt = new Date().toISOString();
    nextToken.positionInQueue = 0;
    nextToken.estimatedWaitMinutes = 0;

    const remaining = state.waitingTokens.slice(1).map((tok, idx) => ({
      ...tok,
      positionInQueue: idx + 1,
      estimatedWaitMinutes: (idx + 1) * 12
    }));

    this.queueStateSubject.next({
      ...state,
      currentServingToken: nextToken,
      lastCalledToken: state.currentServingToken,
      waitingTokens: remaining,
      totalWaitingCount: remaining.length,
      lastUpdated: new Date().toISOString()
    });

    return nextToken;
  }

  public playChime(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {
      // AudioContext not allowed or muted, ignore gracefully
    }
  }
}
