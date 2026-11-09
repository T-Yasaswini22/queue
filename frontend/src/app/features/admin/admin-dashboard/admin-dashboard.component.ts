import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServiceService } from '../../../core/services/service.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { QueueService } from '../../../core/services/queue.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Service, CreateServiceDto } from '../../../core/models/service.model';
import { Appointment } from '../../../core/models/appointment.model';
import { User, UserRole } from '../../../core/models/user.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

const INITIAL_USERS: User[] = [
  { id: 'usr_001', name: 'Sarah Jenkins', email: 'sarah.user@queueless.com', role: 'USER', phone: '+1 (555) 234-5678', isActive: true, createdAt: '2026-01-15' },
  { id: 'usr_002', name: 'David Miller', email: 'david.m@example.com', role: 'USER', phone: '+1 (555) 345-6789', isActive: true, createdAt: '2026-02-01' },
  { id: 'usr_003', name: 'Emily Watson', email: 'emily.w@example.com', role: 'USER', phone: '+1 (555) 456-7890', isActive: true, createdAt: '2026-02-04' },
  { id: 'stf_001', name: 'Dr. Michael Chen', email: 'chen.staff@queueless.com', role: 'STAFF', department: 'General Healthcare', counterAssigned: 'Counter 1', isActive: true, createdAt: '2025-11-10' },
  { id: 'stf_002', name: 'Dr. Sarah Lin', email: 'lin.dental@queueless.com', role: 'STAFF', department: 'Dental Clinic', counterAssigned: 'Counter 2', isActive: true, createdAt: '2025-12-01' },
  { id: 'stf_003', name: 'Officer Marcus Bell', email: 'bell.passport@queueless.com', role: 'STAFF', department: 'Civil Affairs', counterAssigned: 'Counter 3', isActive: true, createdAt: '2025-10-15' },
  { id: 'adm_001', name: 'Alexandria Rivera', email: 'admin@queueless.com', role: 'ADMIN', department: 'Operations', isActive: true, createdAt: '2025-08-01' }
];

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    SidebarComponent
  ],
  template: `
    <div class="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <app-sidebar class="hidden lg:block"></app-sidebar>

      <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
        <!-- ADMIN HEADER BANNER -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md mb-2">
              <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
              Administrative Console
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Facility Management Hub
            </h1>
            <p class="text-xs sm:text-sm text-slate-300 mt-1">
              Configure services, assign counter personnel, supervise queue policies, and monitor system health.
            </p>
          </div>

          <!-- Quick Navigation to Reports -->
          <a
            routerLink="/reports"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all shrink-0"
          >
            📊 View Reports & Analytics
          </a>
        </div>

        <!-- MODULE TABS -->
        <div class="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
          <button
            (click)="activeModule = 'OVERVIEW'"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            [ngClass]="activeModule === 'OVERVIEW' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
          >
            Overview KPI
          </button>
          <button
            (click)="activeModule = 'SERVICES'"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            [ngClass]="activeModule === 'SERVICES' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
          >
            Services ({{ services.length }})
          </button>
          <button
            (click)="activeModule = 'USERS'"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            [ngClass]="activeModule === 'USERS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
          >
            Users & Staff ({{ users.length }})
          </button>
          <button
            (click)="activeModule = 'APPOINTMENTS'"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            [ngClass]="activeModule === 'APPOINTMENTS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
          >
            All Appointments ({{ allAppointments.length }})
          </button>
        </div>

        <!-- MODULE 1: OVERVIEW -->
        <div *ngIf="activeModule === 'OVERVIEW'" class="space-y-8 animate-in fade-in">
          <!-- KPI Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
              <span class="text-3xl font-extrabold text-slate-900 mt-1 block">1,248</span>
              <span class="text-[11px] text-emerald-600 font-bold">+18% this week</span>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Services</span>
              <span class="text-3xl font-extrabold text-blue-600 mt-1 block">{{ services.length }}</span>
              <span class="text-[11px] text-slate-500">Across 4 sectors</span>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Staff Operators</span>
              <span class="text-3xl font-extrabold text-amber-600 mt-1 block">{{ staffUsers.length }}</span>
              <span class="text-[11px] text-slate-500">6 counters active</span>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average Wait</span>
              <span class="text-3xl font-extrabold text-indigo-600 mt-1 block">13.5 <span class="text-sm font-normal text-slate-500">mins</span></span>
              <span class="text-[11px] text-emerald-600 font-bold">Within target window</span>
            </div>
          </div>

          <!-- Quick Actions & Health Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 class="text-base font-bold text-slate-900">Administrative Quick Actions</h3>
              <div class="grid grid-cols-2 gap-3">
                <button
                  (click)="openAddServiceModal()"
                  class="p-4 rounded-2xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold flex flex-col items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                >
                  <span class="text-xl">+</span>
                  Add New Service Desk
                </button>
                <button
                  (click)="activeModule = 'USERS'"
                  class="p-4 rounded-2xl bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold flex flex-col items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
                >
                  <span class="text-xl">👥</span>
                  Manage Staff Desks
                </button>
                <button
                  (click)="activeModule = 'APPOINTMENTS'"
                  class="p-4 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex flex-col items-center justify-center gap-2 hover:bg-amber-100 transition-colors"
                >
                  <span class="text-xl">📋</span>
                  View Appointments
                </button>
                <a
                  routerLink="/reports"
                  class="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex flex-col items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                >
                  <span class="text-xl">📈</span>
                  Export Analytics CSV
                </a>
              </div>
            </div>

            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 class="text-base font-bold text-slate-900">System Integration Status</h3>
              <div class="space-y-3 text-xs">
                <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span class="font-bold text-slate-700">Backend API URL</span>
                  <span class="font-mono text-blue-600 font-semibold">http://localhost:5000/api</span>
                </div>
                <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span class="font-bold text-slate-700">Token Dispatch Engine</span>
                  <span class="text-emerald-600 font-bold">Operational (5s heartbeat)</span>
                </div>
                <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span class="font-bold text-slate-700">Audio Broadcast Chime</span>
                  <span class="text-emerald-600 font-bold">HTML5 Web Audio Synthesizer</span>
                </div>
                <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span class="font-bold text-slate-700">Authentication Protocol</span>
                  <span class="text-slate-800 font-semibold">JWT Bearer Authorization</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MODULE 2: SERVICES MANAGEMENT -->
        <div *ngIf="activeModule === 'SERVICES'" class="space-y-6 animate-in fade-in">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Configured Service Counters</h2>
              <p class="text-xs text-slate-500">Manage public departments, slot durations, and assigned prefixes.</p>
            </div>
            <button
              (click)="openAddServiceModal()"
              class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-center"
            >
              + Create New Service
            </button>
          </div>

          <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600">
                <thead class="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th class="p-4">Prefix</th>
                    <th class="p-4">Service Name</th>
                    <th class="p-4">Category</th>
                    <th class="p-4">Duration</th>
                    <th class="p-4">Counter</th>
                    <th class="p-4">Status</th>
                    <th class="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let s of services" class="hover:bg-slate-50/70 transition-colors">
                    <td class="p-4 font-mono font-bold text-blue-600">{{ s.counterPrefix }}</td>
                    <td class="p-4 font-bold text-slate-900">{{ s.name }}</td>
                    <td class="p-4">{{ s.category }}</td>
                    <td class="p-4">{{ s.durationMinutes }} mins</td>
                    <td class="p-4 font-semibold text-slate-700">{{ s.defaultCounter }}</td>
                    <td class="p-4">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            [ngClass]="s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'">
                        {{ s.isActive ? 'Active' : 'Disabled' }}
                      </span>
                    </td>
                    <td class="p-4 text-right space-x-2">
                      <button (click)="toggleServiceActive(s)" class="text-blue-600 hover:text-blue-800 font-bold">
                        {{ s.isActive ? 'Disable' : 'Enable' }}
                      </button>
                      <button (click)="deleteService(s.id)" class="text-rose-600 hover:text-rose-800 font-bold">
                        Delete
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- MODULE 3: USERS & STAFF -->
        <div *ngIf="activeModule === 'USERS'" class="space-y-6 animate-in fade-in">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900">User & Personnel Directory</h2>
              <p class="text-xs text-slate-500">Supervise roles (USER, STAFF, ADMIN) and assigned counter locations.</p>
            </div>
            <!-- Role filter -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-400">Filter Role:</span>
              <select
                [(ngModel)]="userRoleFilter"
                class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700"
              >
                <option value="ALL">All Roles</option>
                <option value="USER">USER</option>
                <option value="STAFF">STAFF</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>

          <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600">
                <thead class="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th class="p-4">Name</th>
                    <th class="p-4">Email</th>
                    <th class="p-4">Role</th>
                    <th class="p-4">Department / Desk</th>
                    <th class="p-4">Status</th>
                    <th class="p-4 text-right">Role Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let u of filteredUsers" class="hover:bg-slate-50/70 transition-colors">
                    <td class="p-4 font-bold text-slate-900">{{ u.name }}</td>
                    <td class="p-4 text-slate-500">{{ u.email }}</td>
                    <td class="p-4">
                      <span
                        class="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase"
                        [ngClass]="{
                          'bg-blue-100 text-blue-700': u.role === 'USER',
                          'bg-amber-100 text-amber-800': u.role === 'STAFF',
                          'bg-indigo-100 text-indigo-800': u.role === 'ADMIN'
                        }"
                      >
                        {{ u.role }}
                      </span>
                    </td>
                    <td class="p-4 text-slate-700 font-medium">
                      {{ u.counterAssigned || u.department || 'General' }}
                    </td>
                    <td class="p-4">
                      <span class="text-emerald-600 font-bold">Active</span>
                    </td>
                    <td class="p-4 text-right space-x-2">
                      <button *ngIf="u.role !== 'STAFF'" (click)="setUserRole(u, 'STAFF')" class="text-amber-700 hover:text-amber-900 font-bold">
                        Set Staff
                      </button>
                      <button *ngIf="u.role !== 'USER'" (click)="setUserRole(u, 'USER')" class="text-blue-700 hover:text-blue-900 font-bold">
                        Set User
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- MODULE 4: ALL APPOINTMENTS -->
        <div *ngIf="activeModule === 'APPOINTMENTS'" class="space-y-6 animate-in fade-in">
          <!-- Search & Filter Controls -->
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="relative w-full md:w-80">
              <input
                type="text"
                [(ngModel)]="appointmentSearch"
                placeholder="Search token #, service, reason..."
                class="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800"
              />
            </div>

            <div class="flex items-center gap-3 w-full md:w-auto">
              <select
                [(ngModel)]="appointmentStatusFilter"
                class="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="CALLED">CALLED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <button (click)="loadAllAppointments()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700">
                Refresh
              </button>
            </div>
          </div>

          <!-- Table -->
          <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600">
                <thead class="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th class="p-4">Token #</th>
                    <th class="p-4">Service</th>
                    <th class="p-4">Visitor</th>
                    <th class="p-4">Date & Slot</th>
                    <th class="p-4">Counter</th>
                    <th class="p-4">Status</th>
                    <th class="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let apt of paginatedAppointments" class="hover:bg-slate-50/70 transition-colors">
                    <td class="p-4 font-mono font-bold text-blue-700">{{ apt.tokenNumber }}</td>
                    <td class="p-4 font-bold text-slate-900">{{ apt.service?.name }}</td>
                    <td class="p-4 font-medium text-slate-800">{{ apt.user?.name || 'Visitor' }}</td>
                    <td class="p-4">{{ apt.appointmentDate }} ({{ apt.timeSlot }})</td>
                    <td class="p-4 font-semibold text-slate-700">{{ apt.counterAssigned }}</td>
                    <td class="p-4">
                      <app-status-badge [status]="apt.status"></app-status-badge>
                    </td>
                    <td class="p-4 text-right">
                      <a [routerLink]="['/token-display', apt.id]" class="text-blue-600 hover:text-blue-800 font-bold">
                        View
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Bar -->
            <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {{ paginatedAppointments.length }} of {{ filteredAppointments.length }} appointments</span>
              <div class="flex items-center gap-2">
                <button
                  (click)="prevPage()"
                  [disabled]="currentPage === 1"
                  class="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-40"
                >
                  Previous
                </button>
                <span class="font-bold text-slate-700">Page {{ currentPage }} of {{ totalPages || 1 }}</span>
                <button
                  (click)="nextPage()"
                  [disabled]="currentPage >= totalPages"
                  class="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ADD SERVICE MODAL -->
        <div *ngIf="isAddServiceOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 class="text-lg font-bold text-slate-900">Add New Service Desk</h3>
              <button (click)="isAddServiceOpen = false" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form [formGroup]="serviceForm" (ngSubmit)="confirmAddService()" class="space-y-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Service Title *</label>
                <input type="text" formControlName="name" class="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs" />
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Description *</label>
                <textarea rows="2" formControlName="description" class="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Category</label>
                  <select formControlName="category" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs">
                    <option value="Healthcare">Healthcare</option>
                    <option value="Government & Civil">Government & Civil</option>
                    <option value="Financial Services">Financial Services</option>
                    <option value="Legal Services">Legal Services</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Counter Prefix (3 chars)</label>
                  <input type="text" formControlName="counterPrefix" maxlength="4" class="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs uppercase" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Duration (Mins)</label>
                  <input type="number" formControlName="durationMinutes" class="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs" />
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Default Counter Desk</label>
                  <input type="text" formControlName="defaultCounter" class="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs" />
                </div>
              </div>

              <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" (click)="isAddServiceOpen = false" class="px-4 py-2 text-xs font-bold text-slate-700">Cancel</button>
                <button type="submit" [disabled]="serviceForm.invalid" class="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl shadow-xs">
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private serviceService = inject(ServiceService);
  private appointmentService = inject(AppointmentService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  activeModule: 'OVERVIEW' | 'SERVICES' | 'USERS' | 'APPOINTMENTS' = 'OVERVIEW';

  services: Service[] = [];
  users: User[] = INITIAL_USERS;
  allAppointments: Appointment[] = [];

  userRoleFilter = 'ALL';
  appointmentSearch = '';
  appointmentStatusFilter = 'ALL';
  currentPage = 1;
  pageSize = 5;

  isAddServiceOpen = false;
  serviceForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    category: ['Healthcare', Validators.required],
    counterPrefix: ['CLI', [Validators.required, Validators.maxLength(4)]],
    durationMinutes: [20, Validators.required],
    defaultCounter: ['Counter 1', Validators.required],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadServices();
    this.loadAllAppointments();
  }

  loadServices(): void {
    this.serviceService.getServices().subscribe({
      next: (data) => this.services = data
    });
  }

  loadAllAppointments(): void {
    this.appointmentService.getAllAppointments().subscribe({
      next: (list) => this.allAppointments = list
    });
  }

  get staffUsers(): User[] {
    return this.users.filter(u => u.role === 'STAFF');
  }

  get filteredUsers(): User[] {
    if (this.userRoleFilter === 'ALL') return this.users;
    return this.users.filter(u => u.role === this.userRoleFilter);
  }

  get filteredAppointments(): Appointment[] {
    let list = [...this.allAppointments];
    if (this.appointmentStatusFilter !== 'ALL') {
      list = list.filter(a => a.status === this.appointmentStatusFilter);
    }
    if (this.appointmentSearch.trim()) {
      const q = this.appointmentSearch.toLowerCase();
      list = list.filter(a =>
        a.tokenNumber.toLowerCase().includes(q) ||
        (a.service?.name && a.service.name.toLowerCase().includes(q)) ||
        (a.reason && a.reason.toLowerCase().includes(q))
      );
    }
    return list;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAppointments.length / this.pageSize);
  }

  get paginatedAppointments(): Appointment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAppointments.slice(start, start + this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  toggleServiceActive(service: Service): void {
    this.serviceService.updateService(service.id, { isActive: !service.isActive }).subscribe({
      next: () => this.loadServices()
    });
  }

  deleteService(id: string): void {
    this.serviceService.deleteService(id).subscribe({
      next: () => this.loadServices()
    });
  }

  setUserRole(user: User, role: UserRole): void {
    user.role = role;
    this.toast.success(`Updated ${user.name}'s role to ${role}`);
  }

  openAddServiceModal(): void {
    this.serviceForm.reset({
      name: '',
      description: '',
      category: 'Healthcare',
      counterPrefix: 'MED',
      durationMinutes: 20,
      defaultCounter: 'Counter 1',
      isActive: true
    });
    this.isAddServiceOpen = true;
  }

  confirmAddService(): void {
    if (this.serviceForm.invalid) return;
    this.serviceService.createService(this.serviceForm.value).subscribe({
      next: () => {
        this.isAddServiceOpen = false;
        this.loadServices();
      }
    });
  }
}
