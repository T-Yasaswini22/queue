import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Service, ServiceCategory, TimeSlot, CreateServiceDto } from '../models/service.model';
import { ToastService } from './toast.service';

const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-001',
    name: 'General Consultation & Health Check',
    description: 'Comprehensive physical examination, vital stats assessment, prescription renewals, and general clinical guidance with licensed physicians.',
    category: 'Healthcare',
    durationMinutes: 20,
    counterPrefix: 'MED',
    defaultCounter: 'Counter 1',
    estimatedWaitMinutes: 15,
    fee: 45,
    isActive: true,
    icon: 'heart-pulse',
    requirements: ['Government Photo ID', 'Current Medication List', 'Health Insurance Card'],
    operatingHours: { open: '08:30 AM', close: '05:00 PM', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
    totalServedToday: 42
  },
  {
    id: 'srv-002',
    name: 'Dental Care & Hygiene Screening',
    description: 'Routine teeth cleaning, cavity inspection, digital X-ray screening, and orthodontic consultation.',
    category: 'Healthcare',
    durationMinutes: 30,
    counterPrefix: 'DEN',
    defaultCounter: 'Counter 2',
    estimatedWaitMinutes: 25,
    fee: 65,
    isActive: true,
    icon: 'smile',
    requirements: ['Identification Card', 'Previous Dental Records (if any)'],
    operatingHours: { open: '09:00 AM', close: '04:30 PM', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    totalServedToday: 28
  },
  {
    id: 'srv-003',
    name: 'Passport & Identity Verification',
    description: 'Biometric capture, document authentication, application review, and immediate issuance of renewal tokens.',
    category: 'Government & Civil',
    durationMinutes: 15,
    counterPrefix: 'PAS',
    defaultCounter: 'Counter 3',
    estimatedWaitMinutes: 10,
    fee: 25,
    isActive: true,
    icon: 'fingerprint',
    requirements: ['Original Birth Certificate', 'Old Passport / National ID', '2 Recent Passport Photos'],
    operatingHours: { open: '08:00 AM', close: '04:00 PM', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    totalServedToday: 68
  },
  {
    id: 'srv-004',
    name: 'Wealth Management & Loan Advisory',
    description: 'Personalized retail banking advisory, home/car mortgage pre-approval, and investment portfolio reviews.',
    category: 'Financial Services',
    durationMinutes: 35,
    counterPrefix: 'FIN',
    defaultCounter: 'Counter 4',
    estimatedWaitMinutes: 20,
    fee: 0,
    isActive: true,
    icon: 'briefcase',
    requirements: ['Latest 3 Months Bank Statements', 'Income Proof / Tax Returns', 'Government Photo ID'],
    operatingHours: { open: '09:00 AM', close: '05:00 PM', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    totalServedToday: 19
  },
  {
    id: 'srv-005',
    name: 'Driver License & Road Safety Certification',
    description: 'Knowledge test administration, vision testing, learner license endorsements, and biometric card renewal.',
    category: 'Government & Civil',
    durationMinutes: 25,
    counterPrefix: 'RTO',
    defaultCounter: 'Counter 5',
    estimatedWaitMinutes: 30,
    fee: 35,
    isActive: true,
    icon: 'car',
    requirements: ['Medical Fitness Form', 'Proof of Residence', 'Existing Driving License'],
    operatingHours: { open: '08:30 AM', close: '04:30 PM', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
    totalServedToday: 53
  },
  {
    id: 'srv-006',
    name: 'Notary & Legal Document Attestation',
    description: 'Official seal attestation, power of attorney verification, statutory declarations, and certified legal document copies.',
    category: 'Legal Services',
    durationMinutes: 15,
    counterPrefix: 'LAW',
    defaultCounter: 'Counter 6',
    estimatedWaitMinutes: 12,
    fee: 40,
    isActive: true,
    icon: 'scale',
    requirements: ['Unsigned Original Documents', 'Two Forms of Photo ID', 'Witness presence (if required)'],
    operatingHours: { open: '09:30 AM', close: '05:30 PM', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    totalServedToday: 31
  }
];

const INITIAL_CATEGORIES: ServiceCategory[] = [
  { id: 'cat-1', name: 'Healthcare', description: 'Clinical consultations, dental care, and diagnostic assessments', icon: 'heart-pulse' },
  { id: 'cat-2', name: 'Government & Civil', description: 'Passports, identity cards, and transportation licensing', icon: 'landmark' },
  { id: 'cat-3', name: 'Financial Services', description: 'Banking consultations, mortgages, and investment planning', icon: 'landmark-dollar' },
  { id: 'cat-4', name: 'Legal Services', description: 'Attestations, affidavits, and notary certifications', icon: 'scale' }
];

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  private servicesSubject = new BehaviorSubject<Service[]>(INITIAL_SERVICES);
  public services$ = this.servicesSubject.asObservable();

  getCategories(): Observable<ServiceCategory[]> {
    const url = `${environment.apiUrl}/services/categories`;
    return this.http.get<ServiceCategory[]>(url).pipe(
      catchError(() => of(INITIAL_CATEGORIES))
    );
  }

  getServices(category?: string, searchTerm?: string): Observable<Service[]> {
    const url = `${environment.apiUrl}/services`;
    return this.http.get<Service[]>(url).pipe(
      tap(services => {
        if (services && services.length) {
          this.servicesSubject.next(services);
        }
      }),
      catchError(() => of(this.servicesSubject.value)),
      map(services => {
        let list = [...services];
        if (category && category !== 'All') {
          list = list.filter(s => s.category.toLowerCase() === category.toLowerCase());
        }
        if (searchTerm && searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          list = list.filter(s =>
            s.name.toLowerCase().includes(term) ||
            s.description.toLowerCase().includes(term) ||
            s.counterPrefix.toLowerCase().includes(term)
          );
        }
        return list;
      })
    );
  }

  getServiceById(id: string): Observable<Service | undefined> {
    const url = `${environment.apiUrl}/services/${id}`;
    return this.http.get<Service>(url).pipe(
      catchError(() => {
        const found = this.servicesSubject.value.find(s => s.id === id);
        return of(found);
      })
    );
  }

  getAvailableSlots(serviceId: string, date: string): Observable<TimeSlot[]> {
    const url = `${environment.apiUrl}/services/${serviceId}/slots?date=${date}`;
    return this.http.get<TimeSlot[]>(url).pipe(
      catchError(() => {
        // Generate realistic time slots from 09:00 to 17:00
        const slots: TimeSlot[] = [
          { id: 'slot-1', startTime: '09:00 AM', endTime: '09:30 AM', available: true, capacity: 4, bookedCount: 2 },
          { id: 'slot-2', startTime: '09:30 AM', endTime: '10:00 AM', available: true, capacity: 4, bookedCount: 1 },
          { id: 'slot-3', startTime: '10:00 AM', endTime: '10:30 AM', available: false, capacity: 4, bookedCount: 4 },
          { id: 'slot-4', startTime: '10:30 AM', endTime: '11:00 AM', available: true, capacity: 4, bookedCount: 3 },
          { id: 'slot-5', startTime: '11:00 AM', endTime: '11:30 AM', available: true, capacity: 4, bookedCount: 0 },
          { id: 'slot-6', startTime: '11:30 AM', endTime: '12:00 PM', available: true, capacity: 4, bookedCount: 2 },
          { id: 'slot-7', startTime: '01:00 PM', endTime: '01:30 PM', available: true, capacity: 4, bookedCount: 1 },
          { id: 'slot-8', startTime: '01:30 PM', endTime: '02:00 PM', available: true, capacity: 4, bookedCount: 2 },
          { id: 'slot-9', startTime: '02:00 PM', endTime: '02:30 PM', available: false, capacity: 4, bookedCount: 4 },
          { id: 'slot-10', startTime: '02:30 PM', endTime: '03:00 PM', available: true, capacity: 4, bookedCount: 1 },
          { id: 'slot-11', startTime: '03:00 PM', endTime: '03:30 PM', available: true, capacity: 4, bookedCount: 0 },
          { id: 'slot-12', startTime: '03:30 PM', endTime: '04:00 PM', available: true, capacity: 4, bookedCount: 3 },
          { id: 'slot-13', startTime: '04:00 PM', endTime: '04:30 PM', available: true, capacity: 4, bookedCount: 2 },
          { id: 'slot-14', startTime: '04:30 PM', endTime: '05:00 PM', available: true, capacity: 4, bookedCount: 1 },
        ];
        return of(slots);
      })
    );
  }

  createService(dto: CreateServiceDto): Observable<Service> {
    const url = `${environment.apiUrl}/services`;
    return this.http.post<Service>(url, dto).pipe(
      tap(created => {
        const current = this.servicesSubject.value;
        this.servicesSubject.next([created, ...current]);
        this.toast.success(`Service "${created.name}" created successfully`);
      }),
      catchError(() => {
        const newService: Service = {
          id: 'srv-' + Math.random().toString(36).substring(2, 7),
          name: dto.name,
          description: dto.description,
          category: dto.category,
          durationMinutes: dto.durationMinutes,
          counterPrefix: dto.counterPrefix,
          defaultCounter: dto.defaultCounter,
          estimatedWaitMinutes: Math.round(dto.durationMinutes * 0.75),
          fee: dto.fee || 0,
          isActive: dto.isActive,
          requirements: dto.requirements || ['Government ID Card'],
          totalServedToday: 0
        };
        const current = this.servicesSubject.value;
        this.servicesSubject.next([newService, ...current]);
        this.toast.success(`Service "${newService.name}" created (local state)`);
        return of(newService);
      })
    );
  }

  updateService(id: string, updates: Partial<Service>): Observable<Service> {
    const url = `${environment.apiUrl}/services/${id}`;
    return this.http.put<Service>(url, updates).pipe(
      tap(updated => {
        const list = this.servicesSubject.value.map(s => s.id === id ? updated : s);
        this.servicesSubject.next(list);
        this.toast.success(`Service updated successfully`);
      }),
      catchError(() => {
        const list = this.servicesSubject.value.map(s => {
          if (s.id === id) {
            return { ...s, ...updates };
          }
          return s;
        });
        this.servicesSubject.next(list);
        const updated = list.find(s => s.id === id)!;
        this.toast.success('Service updated');
        return of(updated);
      })
    );
  }

  deleteService(id: string): Observable<boolean> {
    const url = `${environment.apiUrl}/services/${id}`;
    return this.http.delete<boolean>(url).pipe(
      tap(() => {
        const list = this.servicesSubject.value.filter(s => s.id !== id);
        this.servicesSubject.next(list);
        this.toast.success('Service removed successfully');
      }),
      catchError(() => {
        const list = this.servicesSubject.value.filter(s => s.id !== id);
        this.servicesSubject.next(list);
        this.toast.success('Service removed');
        return of(true);
      })
    );
  }
}
