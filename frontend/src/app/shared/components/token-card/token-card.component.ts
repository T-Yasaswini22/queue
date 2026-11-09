import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-token-card',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  template: `
    <div class="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50/40 rounded-3xl border border-slate-200/80 shadow-xl transition-all duration-300 hover:shadow-2xl">
      <!-- Top banner ribbon -->
      <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-6 py-4 flex items-center justify-between text-white">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-sm">
            QL
          </div>
          <span class="text-xs uppercase tracking-widest font-semibold text-blue-100">QueueLess Digital Pass</span>
        </div>
        <app-status-badge [status]="status"></app-status-badge>
      </div>

      <div class="p-6 md:p-8">
        <!-- Main Token Highlight -->
        <div class="text-center py-4 border-b border-dashed border-slate-200">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Assigned Token Number</span>
          <div class="mt-2 text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 bg-clip-text text-transparent">
            {{ tokenNumber }}
          </div>
          <p class="mt-2 text-sm font-medium text-slate-700">{{ serviceName }}</p>
          <div class="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-semibold">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Assigned to {{ counterAssigned }}
          </div>
        </div>

        <!-- Token Metas Grid -->
        <div class="grid grid-cols-2 gap-4 my-6 text-sm">
          <div class="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <span class="text-xs font-medium text-slate-400 block mb-1">Queue Position</span>
            <div class="flex items-center gap-1.5 font-bold text-slate-800 text-lg">
              <span *ngIf="positionInQueue > 0" class="text-blue-600">#{{ positionInQueue }}</span>
              <span *ngIf="positionInQueue === 0" class="text-emerald-600">Now Serving!</span>
              <span *ngIf="positionInQueue > 0" class="text-xs font-normal text-slate-500">in line</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <span class="text-xs font-medium text-slate-400 block mb-1">Estimated Wait</span>
            <div class="flex items-center gap-1 font-bold text-slate-800 text-lg">
              <span class="text-indigo-600">~{{ estimatedWaitMinutes }}</span>
              <span class="text-xs font-normal text-slate-500">mins</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <span class="text-xs font-medium text-slate-400 block mb-1">Date</span>
            <span class="font-semibold text-slate-700">{{ appointmentDate }}</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <span class="text-xs font-medium text-slate-400 block mb-1">Time Window</span>
            <span class="font-semibold text-slate-700">{{ timeSlot }}</span>
          </div>
        </div>

        <!-- Simulated QR Code & Barcode -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100/80 border border-slate-200/60">
          <div class="flex items-center gap-3">
            <!-- Simulated QR box -->
            <div class="w-14 h-14 bg-white p-1 rounded-xl border border-slate-300 shadow-inner grid grid-cols-4 gap-0.5">
              <div class="bg-slate-900 rounded-sm"></div>
              <div class="bg-slate-900 rounded-sm"></div>
              <div class="bg-slate-200"></div>
              <div class="bg-slate-900 rounded-sm"></div>
              <div class="bg-slate-200"></div>
              <div class="bg-slate-900 rounded-sm"></div>
              <div class="bg-slate-900 rounded-sm"></div>
              <div class="bg-slate-200"></div>
              <div class="bg-slate-900 rounded-sm"></div>
              <div class="bg-slate-200"></div>
              <div class="bg-slate-900 rounded-sm"></div>
              <div class="bg-slate-900 rounded-sm"></div>
              <div class="bg-slate-900 rounded-sm"></div>
              <div class="bg-slate-900 rounded-sm"></div>
              <div class="bg-slate-200"></div>
              <div class="bg-slate-900 rounded-sm"></div>
            </div>
            <div>
              <p class="text-xs font-bold text-slate-800">Scan at Counter</p>
              <p class="text-[11px] text-slate-500">Fast check-in via optical scanner</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button
              (click)="printToken()"
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition-all"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              (click)="copyToken()"
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TokenCardComponent {
  @Input() tokenNumber = 'QUE-001';
  @Input() serviceName = 'Service';
  @Input() counterAssigned = 'Counter 1';
  @Input() appointmentDate = 'Today';
  @Input() timeSlot = '09:00 AM';
  @Input() positionInQueue = 1;
  @Input() estimatedWaitMinutes = 15;
  @Input() status = 'CONFIRMED';

  private toast = inject(ToastService);

  printToken(): void {
    window.print();
  }

  copyToken(): void {
    navigator.clipboard?.writeText(this.tokenNumber);
    this.toast.success(`Token ${this.tokenNumber} copied to clipboard!`);
  }
}
