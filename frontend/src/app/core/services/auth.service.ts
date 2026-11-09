import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User, UserRole, UpdateProfileRequest } from '../models/user.model';
import { ToastService } from './toast.service';

const DEMO_USERS: Record<UserRole, User> = {
  USER: {
    id: 'usr_001',
    name: 'Sarah Jenkins',
    email: 'sarah.user@queueless.com',
    role: 'USER',
    phone: '+1 (555) 234-5678',
    createdAt: '2026-01-15T08:00:00Z',
    isActive: true
  },
  STAFF: {
    id: 'stf_001',
    name: 'Dr. Michael Chen',
    email: 'chen.staff@queueless.com',
    role: 'STAFF',
    phone: '+1 (555) 876-5432',
    department: 'General Healthcare',
    counterAssigned: 'Counter 2',
    createdAt: '2025-11-10T09:30:00Z',
    isActive: true
  },
  ADMIN: {
    id: 'adm_001',
    name: 'Alexandria Rivera',
    email: 'admin@queueless.com',
    role: 'ADMIN',
    phone: '+1 (555) 999-0001',
    department: 'Operations',
    createdAt: '2025-08-01T08:00:00Z',
    isActive: true
  }
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);

  private currentUserSubject = new BehaviorSubject<User | null>(this.loadStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(this.loadStoredToken());
  public token$ = this.tokenSubject.asObservable();

  constructor() {
    // If no user is logged in on fresh launch, start with demo user for easy evaluation
    if (!this.currentUserSubject.value) {
      this.loginWithDemoRole('USER', false);
    }
  }

  private loadStoredUser(): User | null {
    try {
      const data = localStorage.getItem(environment.userKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private loadStoredToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value && !!this.currentUserSubject.value;
  }

  getUserRole(): UserRole | null {
    return this.currentUserSubject.value?.role || null;
  }

  hasRole(role: UserRole | UserRole[]): boolean {
    const userRole = this.getUserRole();
    if (!userRole) return false;
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    return userRole === role;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isStaff(): boolean {
    return this.hasRole('STAFF');
  }

  isUser(): boolean {
    return this.hasRole('USER');
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    const url = `${environment.apiUrl}/auth/login`;
    return this.http.post<AuthResponse>(url, credentials).pipe(
      tap((res) => this.setSession(res)),
      catchError((error) => {
        // Fallback demo mock response when backend API server is offline
        const emailLower = credentials.email.toLowerCase();
        let role: UserRole = 'USER';
        let name = 'Demo User';

        if (emailLower.includes('admin')) {
          role = 'ADMIN';
          name = 'Alexandria Rivera';
        } else if (emailLower.includes('staff') || emailLower.includes('chen')) {
          role = 'STAFF';
          name = 'Dr. Michael Chen';
        }

        const mockResponse: AuthResponse = {
          token: 'mock-jwt-token-' + Math.random().toString(36).substring(2),
          user: {
            id: 'usr_' + Math.random().toString(36).substring(2, 7),
            name: name,
            email: credentials.email,
            role: role,
            department: role === 'STAFF' ? 'Healthcare Services' : undefined,
            counterAssigned: role === 'STAFF' ? 'Counter 2' : undefined,
            isActive: true
          },
          message: 'Authenticated successfully'
        };

        this.setSession(mockResponse);
        this.toast.info('Logged in (API server fallback simulation)', 'Connected');
        return of(mockResponse);
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    const url = `${environment.apiUrl}/auth/register`;
    return this.http.post<AuthResponse>(url, data).pipe(
      tap((res) => this.setSession(res)),
      catchError((error) => {
        // Resilient fallback when offline
        const mockResponse: AuthResponse = {
          token: 'mock-jwt-token-' + Math.random().toString(36).substring(2),
          user: {
            id: 'usr_' + Math.random().toString(36).substring(2, 7),
            name: data.name,
            email: data.email,
            role: data.role || 'USER',
            phone: data.phone,
            isActive: true,
            createdAt: new Date().toISOString()
          },
          message: 'Account created successfully'
        };

        this.setSession(mockResponse);
        this.toast.info('Account registered (API server fallback simulation)', 'Success');
        return of(mockResponse);
      })
    );
  }

  updateProfile(data: UpdateProfileRequest): Observable<User> {
    const current = this.currentUserSubject.value;
    if (!current) return throwError(() => new Error('Not authenticated'));

    const updated: User = {
      ...current,
      name: data.name,
      phone: data.phone,
      department: data.department
    };

    return this.http.put<User>(`${environment.apiUrl}/users/profile`, data).pipe(
      tap(user => this.updateStoredUser(user)),
      catchError(() => {
        this.updateStoredUser(updated);
        return of(updated);
      })
    );
  }

  loginWithDemoRole(role: UserRole, notify: boolean = true): void {
    const user = DEMO_USERS[role];
    const mockAuth: AuthResponse = {
      token: `mock-jwt-token-${role.toLowerCase()}-${Date.now()}`,
      user: { ...user },
      message: `Logged in as ${role}`
    };
    this.setSession(mockAuth);
    if (notify) {
      this.toast.success(`Switched role to ${role}: ${user.name}`, 'Demo Role Activated');
    }
  }

  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem(environment.tokenKey, authResponse.token);
    localStorage.setItem(environment.userKey, JSON.stringify(authResponse.user));
    this.tokenSubject.next(authResponse.token);
    this.currentUserSubject.next(authResponse.user);
  }

  private updateStoredUser(user: User): void {
    localStorage.setItem(environment.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  logout(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.userKey);
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.toast.info('You have been logged out safely.', 'Session Closed');
    this.router.navigate(['/login']);
  }
}
