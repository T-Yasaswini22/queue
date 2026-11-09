import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ServiceService } from '../../../core/services/service.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Service, TimeSlot } from '../../../core/models/service.model';
import { Appointment } from '../../../core/models/appointment.model';
import { TokenCardComponent } from '../../../shared/components/token-card/token-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, TokenCardComponent, LoadingSpinnerComponent],
  template: `
    <div class="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto space-y-8">
        <!-- Header -->
        <div class="text-center space-y-2">
          <span class="text-xs font-bold uppercase tracking-widest text-blue-600">Smart Scheduling</span>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
            Book Your Digital Appointment
          </h1>
          <p class="text-xs sm:text-sm text-slate-600">
            Skip queues entirely. Reserve a dedicated counter slot and receive your instant digital token.
          </p>
        </div>

        <!-- STEP PROGRESS INDICATOR -->
        <div *ngIf="currentStep < 4" class="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div class="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
            <div class="flex flex-col sm:flex-row items-center justify-center gap-2 p-2 rounded-xl transition-all"
                 [ngClass]="currentStep >= 1 ? 'text-blue-700 bg-blue-50/80 font-bold' : 'text-slate-400'">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    [ngClass]="currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'">1</span>
              <span>1. Choose Service</span>
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-center gap-2 p-2 rounded-xl transition-all"
                 [ngClass]="currentStep >= 2 ? 'text-blue-700 bg-blue-50/80 font-bold' : 'text-slate-400'">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    [ngClass]="currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'">2</span>
              <span>2. Date & Time Slot</span>
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-center gap-2 p-2 rounded-xl transition-all"
                 [ngClass]="currentStep >= 3 ? 'text-blue-700 bg-blue-50/80 font-bold' : 'text-slate-400'">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    [ngClass]="currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'">3</span>
              <span>3. Details & Confirm</span>
            </div>
          </div>
        </div>

        <!-- STEP 1: CHOOSE SERVICE -->
        <div *ngIf="currentStep === 1" class="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-900">Step 1: Select Service Desk</h3>
              <p class="text-xs text-slate-500">Pick which department or counter you need to visit.</p>
            </div>
            <span class="text-xs font-semibold text-slate-400">{{ services.length }} Desks Open</span>
          </div>

          <div *ngIf="isLoadingServices" class="py-12">
            <app-loading-spinner message="Loading available services..."></app-loading-spinner>
          </div>

          <div *ngIf="!isLoadingServices" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              *ngFor="let s of services"
              (click)="onSelectService(s)"
              class="p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-md flex flex-col justify-between"
              [ngClass]="selectedService?.id === s.id ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-blue-300 bg-white'"
            >
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                    {{ s.category }}
                  </span>
                  <span class="text-xs font-mono font-bold text-slate-600">{{ s.counterPrefix }}</span>
                </div>
                <h4 class="text-sm font-bold text-slate-900 mb-1">{{ s.name }}</h4>
                <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">{{ s.description }}</p>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>⏱ {{ s.durationMinutes }} mins</span>
                <span class="font-bold text-blue-600">{{ s.defaultCounter }}</span>
              </div>
            </div>
          </div>

          <div class="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              (click)="nextStep()"
              [disabled]="!selectedService"
              class="px-6 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors"
            >
              Continue to Date & Time &rarr;
            </button>
          </div>
        </div>

        <!-- STEP 2: CHOOSE DATE & TIME SLOT -->
        <div *ngIf="currentStep === 2" class="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-900">Step 2: Date & Available Time Slot</h3>
              <p class="text-xs text-slate-500">Service: <span class="font-bold text-blue-600">{{ selectedService?.name }}</span></p>
            </div>
            <button (click)="currentStep = 1" class="text-xs font-bold text-slate-500 hover:text-slate-800">
              Change Service
            </button>
          </div>

          <!-- Date Selector -->
          <div class="max-w-xs">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Appointment Date *
            </label>
            <input
              type="date"
              [min]="minDate"
              [(ngModel)]="selectedDate"
              (ngModelChange)="onDateChange()"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Time Slots Grid -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Available Time Slots on {{ selectedDate }} *
              </label>
              <span class="text-xs text-slate-400">Green = Open, Grey = Fully Booked</span>
            </div>

            <div *ngIf="isLoadingSlots" class="py-8">
              <app-loading-spinner message="Querying counter slot availability..."></app-loading-spinner>
            </div>

            <div *ngIf="!isLoadingSlots" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                *ngFor="let slot of availableSlots"
                type="button"
                [disabled]="!slot.available"
                (click)="selectedTimeSlot = slot.startTime + ' - ' + slot.endTime"
                class="p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1"
                [ngClass]="{
                  'border-blue-600 bg-blue-600 text-white shadow-md': selectedTimeSlot === (slot.startTime + ' - ' + slot.endTime),
                  'border-slate-200 bg-white hover:border-blue-400 text-slate-800': slot.available && selectedTimeSlot !== (slot.startTime + ' - ' + slot.endTime),
                  'border-slate-100 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed': !slot.available
                }"
              >
                <span class="text-xs font-bold">{{ slot.startTime }}</span>
                <span class="text-[10px]" [ngClass]="selectedTimeSlot === (slot.startTime + ' - ' + slot.endTime) ? 'text-blue-100' : 'text-slate-500'">
                  {{ slot.available ? 'Available' : 'Booked' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Bottom Navigation -->
          <div class="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              (click)="currentStep = 1"
              class="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              &larr; Back
            </button>
            <button
              type="button"
              (click)="nextStep()"
              [disabled]="!selectedDate || !selectedTimeSlot"
              class="px-6 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors"
            >
              Continue to Visitor Details &rarr;
            </button>
          </div>
        </div>

        <!-- STEP 3: DETAILS & REASON FORM -->
        <div *ngIf="currentStep === 3" class="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-900">Step 3: Visitor Details & Purpose</h3>
              <p class="text-xs text-slate-500">Provide reason and verify contact info for token SMS/alert dispatch.</p>
            </div>
            <button (click)="currentStep = 2" class="text-xs font-bold text-slate-500 hover:text-slate-800">
              Change Time Slot
            </button>
          </div>

          <!-- Booking Summary Callout -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span class="text-slate-400 block font-semibold">Selected Service</span>
              <span class="font-bold text-slate-800">{{ selectedService?.name }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold">Assigned Desk</span>
              <span class="font-bold text-blue-600">{{ selectedService?.defaultCounter }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold">Date & Time</span>
              <span class="font-bold text-slate-800">{{ selectedDate }} ({{ selectedTimeSlot }})</span>
            </div>
          </div>

          <form [formGroup]="bookingForm" (ngSubmit)="confirmBooking()" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Visitor Name *
                </label>
                <input
                  type="text"
                  formControlName="customerName"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mobile Phone for SMS Alert
                </label>
                <input
                  type="tel"
                  formControlName="customerPhone"
                  placeholder="+1 (555) 000-0000"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Reason / Symptoms / Visit Purpose *
              </label>
              <textarea
                rows="3"
                formControlName="reason"
                placeholder="Briefly state reason for appointment or documentation required..."
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Additional Notes / Special Assistance (Optional)
              </label>
              <input
                type="text"
                formControlName="notes"
                placeholder="e.g. Wheelchair assistance required, translator, etc."
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <!-- Submit -->
            <div class="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                (click)="currentStep = 2"
                class="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                &larr; Back
              </button>
              <button
                type="submit"
                [disabled]="bookingForm.invalid || isSubmitting"
                class="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                <svg *ngIf="isSubmitting" class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Confirm Booking & Generate Digital Token
              </button>
            </div>
          </form>
        </div>

        <!-- STEP 4: DIGITAL TOKEN DISPLAY & CONFIRMATION -->
        <div *ngIf="currentStep === 4 && confirmedAppointment" class="space-y-8 animate-in fade-in zoom-in-95">
          <div class="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center text-emerald-900 space-y-2">
            <div class="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-xl font-extrabold">Appointment Confirmed Successfully!</h2>
            <p class="text-xs text-emerald-700 max-w-md mx-auto">
              Your digital appointment token is officially reserved. Please show this screen or QR barcode at the counter.
            </p>
          </div>

          <!-- DIGITAL TOKEN CARD -->
          <div class="max-w-md mx-auto">
            <app-token-card
              [tokenNumber]="confirmedAppointment.tokenNumber"
              [serviceName]="confirmedAppointment.service?.name || selectedService?.name || 'Service Desk'"
              [counterAssigned]="confirmedAppointment.counterAssigned || selectedService?.defaultCounter || 'Counter 1'"
              [appointmentDate]="confirmedAppointment.appointmentDate"
              [timeSlot]="confirmedAppointment.timeSlot"
              [positionInQueue]="confirmedAppointment.positionInQueue || 1"
              [estimatedWaitMinutes]="confirmedAppointment.estimatedWaitMinutes || 10"
              [status]="confirmedAppointment.status"
            ></app-token-card>
          </div>

          <!-- ACTION BUTTONS -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              routerLink="/live-queue"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Track Live Counter Queue
            </a>

            <a
              routerLink="/my-appointments"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors"
            >
              Go to My Appointments &rarr;
            </a>

            <button
              (click)="resetWizard()"
              class="w-full sm:w-auto px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BookingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private serviceService = inject(ServiceService);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  currentStep = 1;
  services: Service[] = [];
  selectedService: Service | null = null;

  minDate: string = new Date().toISOString().split('T')[0];
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedTimeSlot: string = '';
  availableSlots: TimeSlot[] = [];

  isLoadingServices = true;
  isLoadingSlots = false;
  isSubmitting = false;

  confirmedAppointment: Appointment | null = null;

  bookingForm: FormGroup = this.fb.group({
    customerName: [this.authService.currentUser?.name || '', [Validators.required]],
    customerPhone: [this.authService.currentUser?.phone || ''],
    reason: ['', [Validators.required, Validators.minLength(5)]],
    notes: ['']
  });

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.isLoadingServices = true;
    this.serviceService.getServices().subscribe({
      next: (list) => {
        this.services = list;
        this.isLoadingServices = false;

        // Check query param
        const preselectedId = this.route.snapshot.queryParams['serviceId'];
        if (preselectedId) {
          const match = this.services.find(s => s.id === preselectedId);
          if (match) {
            this.onSelectService(match);
            this.currentStep = 2;
          }
        }
      },
      error: () => {
        this.isLoadingServices = false;
      }
    });
  }

  onSelectService(service: Service): void {
    this.selectedService = service;
    this.loadSlots();
  }

  onDateChange(): void {
    this.selectedTimeSlot = '';
    this.loadSlots();
  }

  loadSlots(): void {
    if (!this.selectedService) return;
    this.isLoadingSlots = true;
    this.serviceService.getAvailableSlots(this.selectedService.id, this.selectedDate).subscribe({
      next: (slots) => {
        this.availableSlots = slots;
        this.isLoadingSlots = false;
      },
      error: () => {
        this.isLoadingSlots = false;
      }
    });
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.selectedService) {
      this.currentStep = 2;
      this.loadSlots();
    } else if (this.currentStep === 2 && this.selectedDate && this.selectedTimeSlot) {
      this.currentStep = 3;
    }
  }

  confirmBooking(): void {
    if (this.bookingForm.invalid || !this.selectedService) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.bookingForm.value;

    this.appointmentService.bookAppointment(
      {
        serviceId: this.selectedService.id,
        appointmentDate: this.selectedDate,
        timeSlot: this.selectedTimeSlot,
        reason: formVal.reason,
        notes: formVal.notes,
        customerName: formVal.customerName,
        customerPhone: formVal.customerPhone
      },
      this.selectedService.name,
      this.selectedService.counterPrefix
    ).subscribe({
      next: (apt) => {
        this.isSubmitting = false;
        this.confirmedAppointment = apt;
        this.currentStep = 4;
      },
      error: () => {
        this.isSubmitting = false;
        this.toast.error('Booking failed. Please try again.');
      }
    });
  }

  resetWizard(): void {
    this.currentStep = 1;
    this.selectedService = null;
    this.selectedTimeSlot = '';
    this.confirmedAppointment = null;
    this.bookingForm.reset({
      customerName: this.authService.currentUser?.name || '',
      customerPhone: this.authService.currentUser?.phone || '',
      reason: '',
      notes: ''
    });
  }
}
