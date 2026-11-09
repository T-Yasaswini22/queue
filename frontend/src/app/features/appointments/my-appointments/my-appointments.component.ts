import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ServiceService } from '../../../core/services/service.service';
import { ToastService } from '../../../core/services/toast.service';
import { Appointment, AppointmentStatus } from '../../../core/models/appointment.model';
import { TimeSlot } from '../../../core/models/service.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto space-y-8">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest text-blue-600">Personal Schedule</span>
            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
              My Appointments & Token Passes
            </h1>
            <p class="text-xs text-slate-500 mt-1">
              View your live tokens, reschedule upcoming visits, or review past counter consultations.
            </p>
          </div>

          <a
            routerLink="/book"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-center"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Book New Token
          </a>
        </div>

        <!-- TABS AND FILTERS BAR -->
        <div class="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <!-- Active / Past Tabs -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button
              (click)="activeTab = 'UPCOMING'"
              class="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all"
              [ngClass]="activeTab === 'UPCOMING' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            >
              Upcoming Active ({{ upcomingAppointments.length }})
            </button>
            <button
              (click)="activeTab = 'PAST'"
              class="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all"
              [ngClass]="activeTab === 'PAST' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            >
              Past & Completed ({{ pastAppointments.length }})
            </button>
          </div>

          <!-- Status Dropdown filter -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <span class="text-xs font-semibold text-slate-400">Status:</span>
            <select
              [(ngModel)]="statusFilter"
              class="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CALLED">Called / Now Serving</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <!-- APPOINTMENTS LIST -->
        <div *ngIf="isLoading" class="py-16">
          <app-loading-spinner message="Loading your appointments..."></app-loading-spinner>
        </div>

        <div *ngIf="!isLoading && displayedAppointments.length > 0" class="space-y-4">
          <div
            *ngFor="let apt of displayedAppointments"
            class="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <!-- Token Badge & Service info -->
            <div class="flex items-start gap-4">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-blue-700 flex flex-col items-center justify-center shrink-0 shadow-xs">
                <span class="text-[9px] uppercase font-bold text-blue-500">Token</span>
                <span class="text-base font-black font-mono tracking-tight">{{ apt.tokenNumber }}</span>
              </div>

              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-base font-bold text-slate-900">{{ apt.service?.name }}</h3>
                  <app-status-badge [status]="apt.status"></app-status-badge>
                </div>

                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                  <span class="flex items-center gap-1">📅 {{ apt.appointmentDate }}</span>
                  <span class="flex items-center gap-1">⏰ {{ apt.timeSlot }}</span>
                  <span class="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                    {{ apt.counterAssigned }}
                  </span>
                </div>

                <p *ngIf="apt.reason" class="text-xs text-slate-600 line-clamp-1 italic pt-1">
                  Purpose: "{{ apt.reason }}"
                </p>

                <p *ngIf="apt.cancellationReason" class="text-xs text-rose-600 font-semibold pt-1">
                  Cancelled Reason: {{ apt.cancellationReason }}
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
              <!-- Digital Ticket Button -->
              <a
                [routerLink]="['/token-display', apt.id]"
                class="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Ticket Pass
              </a>

              <!-- Reschedule Button (for active appointments) -->
              <button
                *ngIf="canReschedule(apt)"
                (click)="openRescheduleModal(apt)"
                class="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                Reschedule
              </button>

              <!-- Cancel Button (for active appointments) -->
              <button
                *ngIf="canCancel(apt)"
                (click)="openCancelModal(apt)"
                class="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <!-- Feedback Button (for completed appointments) -->
              <a
                *ngIf="apt.status === 'COMPLETED'"
                [routerLink]="['/feedback']"
                [queryParams]="{ appointmentId: apt.id, serviceId: apt.serviceId }"
                class="px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors flex items-center gap-1"
              >
                ★ Rate Service
              </a>
            </div>
          </div>
        </div>

        <div *ngIf="!isLoading && displayedAppointments.length === 0" class="py-12">
          <app-empty-state
            title="No appointments match this filter"
            description="You don't have any appointments currently filed in this tab."
            actionLabel="Schedule New Appointment"
            (actionClick)="navigateToBook()"
          ></app-empty-state>
        </div>

        <!-- RESCHEDULE MODAL -->
        <div *ngIf="isRescheduleOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 class="text-lg font-bold text-slate-900">Reschedule Appointment</h3>
                <p class="text-xs text-slate-500">Token: <span class="font-bold font-mono">{{ activeAptToReschedule?.tokenNumber }}</span></p>
              </div>
              <button (click)="isRescheduleOpen = false" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <!-- New Date -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Select New Date *
              </label>
              <input
                type="date"
                [min]="todayDate"
                [(ngModel)]="newRescheduleDate"
                (ngModelChange)="onRescheduleDateChange()"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800"
              />
            </div>

            <!-- New Slot -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Available Slot *
              </label>
              <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                <button
                  *ngFor="let slot of availableRescheduleSlots"
                  type="button"
                  [disabled]="!slot.available"
                  (click)="newRescheduleSlot = slot.startTime + ' - ' + slot.endTime"
                  class="p-2.5 rounded-xl border text-xs font-bold transition-all text-center"
                  [ngClass]="{
                    'border-blue-600 bg-blue-600 text-white': newRescheduleSlot === (slot.startTime + ' - ' + slot.endTime),
                    'border-slate-200 bg-white hover:border-blue-400 text-slate-800': slot.available && newRescheduleSlot !== (slot.startTime + ' - ' + slot.endTime),
                    'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400': !slot.available
                  }"
                >
                  {{ slot.startTime }}
                </button>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                (click)="isRescheduleOpen = false"
                class="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmReschedule()"
                [disabled]="!newRescheduleDate || !newRescheduleSlot || isRescheduling"
                class="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs"
              >
                {{ isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule' }}
              </button>
            </div>
          </div>
        </div>

        <!-- CANCEL CONFIRMATION MODAL -->
        <div *ngIf="isCancelOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 class="text-lg font-bold text-slate-900">Cancel Appointment Token</h3>
            <p class="text-xs text-slate-500">
              Are you sure you want to cancel token <span class="font-bold text-slate-800">{{ activeAptToCancel?.tokenNumber }}</span>? This will release your position in the queue.
            </p>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Reason for Cancellation *
              </label>
              <input
                type="text"
                [(ngModel)]="cancellationReason"
                placeholder="e.g. Schedule conflict, feeling better, etc."
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800"
              />
            </div>

            <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                (click)="isCancelOpen = false"
                class="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                (click)="confirmCancellation()"
                [disabled]="!cancellationReason.trim()"
                class="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MyAppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private serviceService = inject(ServiceService);
  private toast = inject(ToastService);

  appointments: Appointment[] = [];
  isLoading = true;

  activeTab: 'UPCOMING' | 'PAST' = 'UPCOMING';
  statusFilter = 'ALL';

  // Reschedule state
  isRescheduleOpen = false;
  activeAptToReschedule: Appointment | null = null;
  todayDate: string = new Date().toISOString().split('T')[0];
  newRescheduleDate: string = this.todayDate;
  newRescheduleSlot: string = '';
  availableRescheduleSlots: TimeSlot[] = [];
  isRescheduling = false;

  // Cancel state
  isCancelOpen = false;
  activeAptToCancel: Appointment | null = null;
  cancellationReason: string = '';

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.appointmentService.getMyAppointments().subscribe({
      next: (data) => {
        this.appointments = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get upcomingAppointments(): Appointment[] {
    return this.appointments.filter(
      a => a.status === 'CONFIRMED' || a.status === 'PENDING' || a.status === 'CALLED' || a.status === 'IN_PROGRESS'
    );
  }

  get pastAppointments(): Appointment[] {
    return this.appointments.filter(
      a => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'NO_SHOW'
    );
  }

  get displayedAppointments(): Appointment[] {
    let list = this.activeTab === 'UPCOMING' ? this.upcomingAppointments : this.pastAppointments;
    if (this.statusFilter !== 'ALL') {
      list = list.filter(a => a.status === this.statusFilter);
    }
    return list;
  }

  canReschedule(apt: Appointment): boolean {
    return apt.status === 'CONFIRMED' || apt.status === 'PENDING';
  }

  canCancel(apt: Appointment): boolean {
    return apt.status === 'CONFIRMED' || apt.status === 'PENDING';
  }

  openRescheduleModal(apt: Appointment): void {
    this.activeAptToReschedule = apt;
    this.newRescheduleDate = apt.appointmentDate;
    this.newRescheduleSlot = '';
    this.isRescheduleOpen = true;
    this.onRescheduleDateChange();
  }

  onRescheduleDateChange(): void {
    if (!this.activeAptToReschedule) return;
    this.serviceService.getAvailableSlots(this.activeAptToReschedule.serviceId, this.newRescheduleDate).subscribe({
      next: (slots) => {
        this.availableRescheduleSlots = slots;
      }
    });
  }

  confirmReschedule(): void {
    if (!this.activeAptToReschedule || !this.newRescheduleDate || !this.newRescheduleSlot) return;

    this.isRescheduling = true;
    this.appointmentService.rescheduleAppointment(this.activeAptToReschedule.id, {
      appointmentDate: this.newRescheduleDate,
      timeSlot: this.newRescheduleSlot
    }).subscribe({
      next: () => {
        this.isRescheduling = false;
        this.isRescheduleOpen = false;
        this.loadAppointments();
      },
      error: () => {
        this.isRescheduling = false;
      }
    });
  }

  openCancelModal(apt: Appointment): void {
    this.activeAptToCancel = apt;
    this.cancellationReason = '';
    this.isCancelOpen = true;
  }

  confirmCancellation(): void {
    if (!this.activeAptToCancel || !this.cancellationReason.trim()) return;

    this.appointmentService.cancelAppointment(this.activeAptToCancel.id, {
      cancellationReason: this.cancellationReason
    }).subscribe({
      next: () => {
        this.isCancelOpen = false;
        this.loadAppointments();
      }
    });
  }

  navigateToBook(): void {
    window.location.href = '/book';
  }
}
