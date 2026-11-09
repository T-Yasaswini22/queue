import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment } from '../../../core/models/appointment.model';
import { TokenCardComponent } from '../../../shared/components/token-card/token-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-token-display',
  standalone: true,
  imports: [CommonModule, RouterModule, TokenCardComponent, LoadingSpinnerComponent],
  template: `
    <div class="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl mx-auto space-y-6">
        <!-- Breadcrumb / Back button -->
        <div class="flex items-center justify-between">
          <a routerLink="/my-appointments" class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to My Appointments
          </a>
          <button (click)="printTicket()" class="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            🖨️ Print Pass
          </button>
        </div>

        <div *ngIf="isLoading" class="py-16">
          <app-loading-spinner message="Loading your digital token pass..."></app-loading-spinner>
        </div>

        <div *ngIf="!isLoading && appointment" class="space-y-6">
          <!-- Main Digital Token Display -->
          <app-token-card
            [tokenNumber]="appointment.tokenNumber"
            [serviceName]="appointment.service?.name || 'Service Desk'"
            [counterAssigned]="appointment.counterAssigned || 'Counter 1'"
            [appointmentDate]="appointment.appointmentDate"
            [timeSlot]="appointment.timeSlot"
            [positionInQueue]="appointment.positionInQueue || 1"
            [estimatedWaitMinutes]="appointment.estimatedWaitMinutes || 10"
            [status]="appointment.status"
          ></app-token-card>

          <!-- Instructions Card -->
          <div class="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">Next Steps & Instructions:</h4>
            <ol class="space-y-2 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
              <li>Arrive 5-10 minutes prior to your allocated time slot.</li>
              <li>Keep this digital pass open on your smartphone or carry the printed QR copy.</li>
              <li>Monitor the Live Queue Tracker to watch your number advance.</li>
              <li>When your token appears on the electronic screen or chimes, proceed immediately to {{ appointment.counterAssigned }}.</li>
            </ol>
          </div>

          <!-- Bottom CTAs -->
          <div class="flex items-center justify-center gap-4">
            <a
              routerLink="/live-queue"
              class="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs transition-colors"
            >
              Watch Live Queue Radar
            </a>
            <a
              routerLink="/dashboard"
              class="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TokenDisplayComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private appointmentService = inject(AppointmentService);

  appointment?: Appointment;
  isLoading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.appointmentService.getAppointmentById(id).subscribe({
        next: (apt) => {
          this.appointment = apt;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
    }
  }

  printTicket(): void {
    window.print();
  }
}
