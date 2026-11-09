import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ServiceService } from '../../../core/services/service.service';
import { FeedbackService } from '../../../core/services/feedback.service';
import { Service, TimeSlot } from '../../../core/models/service.model';
import { Feedback } from '../../../core/models/feedback.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto space-y-8">
        <!-- Back breadcrumb -->
        <div>
          <a routerLink="/services" class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Services Directory
          </a>
        </div>

        <div *ngIf="isLoading" class="py-16">
          <app-loading-spinner message="Loading service specifications..."></app-loading-spinner>
        </div>

        <div *ngIf="!isLoading && service" class="space-y-8">
          <!-- Main Hero Card -->
          <div class="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-10 space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
                    {{ service.category }}
                  </span>
                  <span class="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Prefix: {{ service.counterPrefix }}
                  </span>
                </div>
                <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {{ service.name }}
                </h1>
              </div>

              <!-- Quick CTA -->
              <a
                [routerLink]="['/book']"
                [queryParams]="{ serviceId: service.id }"
                class="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 shrink-0"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Book Appointment
              </a>
            </div>

            <!-- Description -->
            <p class="text-sm text-slate-600 leading-relaxed">
              {{ service.description }}
            </p>

            <!-- Metrics Matrix -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Service Time</span>
                <span class="text-lg font-extrabold text-slate-800">{{ service.durationMinutes }} mins</span>
              </div>

              <div class="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
                <span class="text-[11px] font-bold uppercase tracking-wider text-amber-700 block mb-1">Current Wait</span>
                <span class="text-lg font-extrabold text-amber-900">~{{ service.estimatedWaitMinutes }} mins</span>
              </div>

              <div class="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-center">
                <span class="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-1">Default Counter</span>
                <span class="text-lg font-extrabold text-blue-900">{{ service.defaultCounter }}</span>
              </div>

              <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">Service Fee</span>
                <span class="text-lg font-extrabold text-emerald-900">
                  {{ service.fee ? ('$' + service.fee) : 'Free / Covered' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Requirements & Operating Hours Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Requirements Card -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mandatory Preparation & Documents
              </h3>
              <p class="text-xs text-slate-500">
                Please have the following items ready when your token is called to ensure swift service without delays.
              </p>

              <ul class="space-y-3 pt-2">
                <li *ngFor="let req of service.requirements" class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium">
                  <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">✓</span>
                  <span>{{ req }}</span>
                </li>
              </ul>
            </div>

            <!-- Operating Hours Card -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Operating Hours & Cadence
              </h3>
              <p class="text-xs text-slate-500">
                Tokens are called sequentially during standard desk operating windows.
              </p>

              <div class="space-y-3 pt-2 text-xs">
                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span class="font-bold text-slate-700">Service Hours:</span>
                  <span class="text-slate-600">{{ service.operatingHours?.open || '08:30 AM' }} - {{ service.operatingHours?.close || '05:00 PM' }}</span>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span class="font-bold text-slate-700">Active Days:</span>
                  <span class="text-slate-600">{{ (service.operatingHours?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).join(', ') }}</span>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span class="font-bold text-slate-700">Digital Check-in:</span>
                  <span class="text-emerald-600 font-semibold">Self-service QR or Mobile Token</span>
                </div>
              </div>
            </div>
          </div>

          <!-- FEEDBACK & COMMUNITY REVIEWS -->
          <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-slate-900">Service Feedback & Experiences</h3>
                <p class="text-xs text-slate-500">Real feedback from verified visitors who used this counter.</p>
              </div>
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                <span>★ 4.9</span>
                <span class="text-[10px] font-normal text-amber-700">(Verified Ratings)</span>
              </div>
            </div>

            <div *ngIf="feedbacks.length > 0; else noReviews" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div *ngFor="let fb of feedbacks" class="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {{ fb.userName.charAt(0) }}
                    </div>
                    <span class="text-xs font-bold text-slate-800">{{ fb.userName }}</span>
                  </div>
                  <div class="text-amber-500 text-xs font-bold">
                    {{ '★'.repeat(fb.rating) }}
                  </div>
                </div>
                <p class="text-xs text-slate-600 italic">"{{ fb.comment }}"</p>
                <div class="flex flex-wrap gap-1 pt-1">
                  <span *ngFor="let tag of fb.tags" class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>

            <ng-template #noReviews>
              <div class="p-6 text-center text-xs text-slate-400">
                No public reviews submitted yet for this service counter.
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ServiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private serviceService = inject(ServiceService);
  private feedbackService = inject(FeedbackService);

  service?: Service;
  feedbacks: Feedback[] = [];
  isLoading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.serviceService.getServiceById(id).subscribe({
        next: (data) => {
          this.service = data;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });

      this.feedbackService.getServiceFeedbacks(id).subscribe({
        next: (list) => {
          this.feedbacks = list;
        }
      });
    }
  }
}
