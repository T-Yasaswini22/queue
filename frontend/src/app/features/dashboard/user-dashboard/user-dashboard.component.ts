import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { QueueService } from '../../../core/services/queue.service';
import { Appointment } from '../../../core/models/appointment.model';
import { LiveQueueState } from '../../../core/models/queue.model';
import { TokenCardComponent } from '../../../shared/components/token-card/token-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TokenCardComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    SidebarComponent
  ],
  template: `
    <div class="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <!-- Sidebar -->
      <app-sidebar class="hidden lg:block"></app-sidebar>

      <!-- Main Dashboard Content -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
        <!-- Header Welcome Banner -->
        <div class="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md mb-3">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected to Digital Queue Dispatch
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {{ authService.currentUser?.name || 'Visitor' }}!
              </h1>
              <p class="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
                Track your active digital token pass, explore counter statuses, or schedule your next visit with ease.
              </p>
            </div>

            <!-- Quick Book CTA -->
            <div class="flex flex-wrap items-center gap-3">
              <a
                routerLink="/book"
                class="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-800 text-xs font-bold hover:bg-blue-50 shadow-md transition-all transform hover:-translate-y-0.5"
              >
                <svg class="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Book New Appointment
              </a>
              <a
                routerLink="/live-queue"
                class="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md transition-all"
              >
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Queue Radar
              </a>
            </div>
          </div>
        </div>

        <!-- KPI SUMMARY CARDS -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <span class="text-xs font-semibold text-slate-400 block">Active Tokens</span>
              <span class="text-2xl font-extrabold text-slate-800">{{ activeAppointments.length }}</span>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span class="text-xs font-semibold text-slate-400 block">Completed Visits</span>
              <span class="text-2xl font-extrabold text-slate-800">{{ completedAppointments.length }}</span>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span class="text-xs font-semibold text-slate-400 block">Saved In Lines</span>
              <span class="text-2xl font-extrabold text-slate-800">~85 <span class="text-xs text-slate-500 font-normal">mins</span></span>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <span class="text-xs font-semibold text-slate-400 block">Total Bookings</span>
              <span class="text-2xl font-extrabold text-slate-800">{{ userAppointments.length }}</span>
            </div>
          </div>
        </div>

        <!-- MAIN GRID: ACTIVE TOKEN PASS & LIVE RADAR -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Active Token Column -->
          <div class="lg:col-span-1 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                Active Digital Pass
              </h2>
              <span *ngIf="primaryActiveAppointment" class="text-xs font-bold text-blue-600">
                Ready for check-in
              </span>
            </div>

            <div *ngIf="primaryActiveAppointment; else noActiveToken">
              <app-token-card
                [tokenNumber]="primaryActiveAppointment.tokenNumber"
                [serviceName]="primaryActiveAppointment.service?.name || 'Assigned Service'"
                [counterAssigned]="primaryActiveAppointment.counterAssigned || 'Counter 1'"
                [appointmentDate]="primaryActiveAppointment.appointmentDate"
                [timeSlot]="primaryActiveAppointment.timeSlot"
                [positionInQueue]="primaryActiveAppointment.positionInQueue || 1"
                [estimatedWaitMinutes]="primaryActiveAppointment.estimatedWaitMinutes || 5"
                [status]="primaryActiveAppointment.status"
              ></app-token-card>
            </div>

            <ng-template #noActiveToken>
              <div class="bg-white rounded-3xl p-6 border border-slate-200 text-center space-y-4">
                <div class="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 class="text-sm font-bold text-slate-800">No Active Queue Pass</h3>
                <p class="text-xs text-slate-500">
                  You don't have any pending token pass for today. Schedule a new appointment to secure your queue slot.
                </p>
                <a
                  routerLink="/book"
                  class="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  Book Token Now
                </a>
              </div>
            </ng-template>
          </div>

          <!-- Upcoming Appointments List Column -->
          <div class="lg:col-span-2 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-bold text-slate-900">
                Upcoming & Recent Appointments
              </h2>
              <a routerLink="/my-appointments" class="text-xs font-semibold text-blue-600 hover:text-blue-800">
                View All Appointments &rarr;
              </a>
            </div>

            <div class="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div *ngIf="userAppointments.length > 0; else emptyApts" class="divide-y divide-slate-100">
                <div
                  *ngFor="let apt of userAppointments.slice(0, 4)"
                  class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex flex-col items-center justify-center shrink-0">
                      <span class="text-[10px] uppercase font-bold text-blue-500">Token</span>
                      <span class="text-xs font-black">{{ apt.tokenNumber }}</span>
                    </div>

                    <div>
                      <h4 class="text-sm font-bold text-slate-900">{{ apt.service?.name }}</h4>
                      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                        <span class="flex items-center gap-1 font-medium">
                          📅 {{ apt.appointmentDate }}
                        </span>
                        <span>•</span>
                        <span class="flex items-center gap-1 font-medium">
                          ⏰ {{ apt.timeSlot }}
                        </span>
                        <span>•</span>
                        <span class="font-medium text-slate-700">
                          {{ apt.counterAssigned }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 self-end sm:self-center">
                    <app-status-badge [status]="apt.status"></app-status-badge>

                    <a
                      [routerLink]="['/token-display', apt.id]"
                      class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      Ticket
                    </a>
                  </div>
                </div>
              </div>

              <ng-template #emptyApts>
                <div class="p-8 text-center">
                  <app-empty-state
                    title="No appointments scheduled"
                    description="You haven't reserved any digital appointment slots yet."
                    actionLabel="Book First Appointment"
                    (actionClick)="navigateToBook()"
                  ></app-empty-state>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        <!-- QUICK EXPLORER FOR POPULAR SERVICES -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-900">
              Explore Available Departments & Counters
            </h2>
            <a routerLink="/services" class="text-xs font-semibold text-blue-600 hover:text-blue-800">
              Browse Directory &rarr;
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">Healthcare</span>
                <h4 class="text-sm font-bold text-slate-900 mt-1">General Consultation & Vitals</h4>
                <p class="text-xs text-slate-500 mt-1">Average wait: ~15 mins • Counter 1</p>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-600">Accepting Bookings</span>
                <a routerLink="/book" class="text-xs font-bold text-blue-600 hover:text-blue-800">Book &rarr;</a>
              </div>
            </div>

            <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <span class="text-xs font-bold text-indigo-600 uppercase tracking-wider">Civil Affairs</span>
                <h4 class="text-sm font-bold text-slate-900 mt-1">Passport & Identity Renewal</h4>
                <p class="text-xs text-slate-500 mt-1">Average wait: ~10 mins • Counter 3</p>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-600">Accepting Bookings</span>
                <a routerLink="/book" class="text-xs font-bold text-blue-600 hover:text-blue-800">Book &rarr;</a>
              </div>
            </div>

            <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <span class="text-xs font-bold text-cyan-600 uppercase tracking-wider">Finance</span>
                <h4 class="text-sm font-bold text-slate-900 mt-1">Wealth Management & Advisory</h4>
                <p class="text-xs text-slate-500 mt-1">Average wait: ~20 mins • Counter 4</p>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-600">Accepting Bookings</span>
                <a routerLink="/book" class="text-xs font-bold text-blue-600 hover:text-blue-800">Book &rarr;</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class UserDashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private queueService = inject(QueueService);

  userAppointments: Appointment[] = [];
  queueState$!: Observable<LiveQueueState>;

  ngOnInit(): void {
    this.queueState$ = this.queueService.getLiveQueueState();
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (list) => {
        this.userAppointments = list;
      }
    });
  }

  get activeAppointments(): Appointment[] {
    return this.userAppointments.filter(
      a => a.status === 'CONFIRMED' || a.status === 'CALLED' || a.status === 'IN_PROGRESS' || a.status === 'PENDING'
    );
  }

  get completedAppointments(): Appointment[] {
    return this.userAppointments.filter(a => a.status === 'COMPLETED');
  }

  get primaryActiveAppointment(): Appointment | undefined {
    // Return CALLED or first active
    return this.activeAppointments.find(a => a.status === 'CALLED') || this.activeAppointments[0];
  }

  navigateToBook(): void {
    window.location.href = '/book';
  }
}
