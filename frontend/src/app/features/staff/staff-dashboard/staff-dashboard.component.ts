import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QueueService } from '../../../core/services/queue.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LiveQueueState, QueueToken } from '../../../core/models/queue.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
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
        <!-- TOP DESK BANNER -->
        <div class="bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md mb-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Counter Console Active
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Staff Desk & Queue Terminal
            </h1>
            <p class="text-xs sm:text-sm text-amber-100 mt-1">
              Operator: <span class="font-bold text-white">{{ authService.currentUser?.name }}</span>
              <span class="mx-2">•</span>
              Assigned Desk: <span class="font-bold text-white">{{ selectedCounter }}</span>
            </p>
          </div>

          <!-- Counter Switcher -->
          <div class="flex items-center gap-3 bg-black/20 p-2 rounded-2xl backdrop-blur-md">
            <span class="text-xs font-semibold text-amber-200">Counter Desk:</span>
            <select
              [(ngModel)]="selectedCounter"
              class="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold border-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="Counter 1">Counter 1 (Dr. Chen)</option>
              <option value="Counter 2">Counter 2 (Dental)</option>
              <option value="Counter 3">Counter 3 (Passports)</option>
              <option value="Counter 4">Counter 4 (Finance)</option>
              <option value="Counter 5">Counter 5 (Licensing)</option>
              <option value="Counter 6">Counter 6 (Legal)</option>
            </select>
          </div>
        </div>

        <!-- STATS ROW -->
        <div *ngIf="queueState" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Waiting Line</span>
            <span class="text-3xl font-extrabold text-blue-600 mt-1 block">{{ queueState.waitingTokens.length }}</span>
            <span class="text-[11px] text-slate-500">Tickets in queue</span>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Completed Today</span>
            <span class="text-3xl font-extrabold text-emerald-600 mt-1 block">{{ queueState.completedTokensCount }}</span>
            <span class="text-[11px] text-slate-500">Visitors serviced</span>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Avg Serving Cadence</span>
            <span class="text-3xl font-extrabold text-amber-600 mt-1 block">14.2 <span class="text-sm font-normal text-slate-500">min</span></span>
            <span class="text-[11px] text-slate-500">Per visitor consultation</span>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Desks</span>
            <span class="text-3xl font-extrabold text-indigo-600 mt-1 block">{{ queueState.activeCounters.length }}</span>
            <span class="text-[11px] text-slate-500">Operational counters</span>
          </div>
        </div>

        <!-- MAIN OPERATIONAL BOARD -->
        <div *ngIf="queueState" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- CURRENT SERVING TOKEN TERMINAL (Lg 2 Cols) -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
                  <h2 class="text-base font-bold text-slate-900 uppercase tracking-wider">
                    Desk Terminal: Now Serving
                  </h2>
                </div>
                <span class="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                  {{ selectedCounter }}
                </span>
              </div>

              <!-- TOKEN IN PROGRESS OR EMPTY -->
              <div *ngIf="queueState.currentServingToken as current; else noActiveToken" class="space-y-6">
                <div class="p-6 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div class="text-center sm:text-left space-y-1">
                    <span class="text-xs font-bold uppercase tracking-wider text-blue-600">Active Token</span>
                    <div class="text-5xl font-black font-mono text-slate-900 tracking-tight">
                      {{ current.tokenNumber }}
                    </div>
                    <p class="text-xs font-semibold text-slate-700">{{ current.serviceName }}</p>
                  </div>

                  <!-- Visitor Specs -->
                  <div class="bg-white p-4 rounded-xl border border-slate-200/80 text-xs space-y-1.5 w-full sm:w-auto">
                    <div>
                      <span class="text-slate-400">Visitor:</span>
                      <span class="font-bold text-slate-800 ml-1">{{ current.customerName }}</span>
                    </div>
                    <div>
                      <span class="text-slate-400">Phone:</span>
                      <span class="font-bold text-slate-800 ml-1">{{ current.customerPhone || 'Not provided' }}</span>
                    </div>
                    <div>
                      <span class="text-slate-400">Time Slot:</span>
                      <span class="font-bold text-slate-800 ml-1">{{ current.timeSlot }}</span>
                    </div>
                    <div class="pt-1">
                      <app-status-badge [status]="current.status"></app-status-badge>
                    </div>
                  </div>
                </div>

                <!-- STAFF ACTION BUTTONS -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <!-- Recall / Chime -->
                  <button
                    type="button"
                    (click)="recallToken()"
                    class="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all"
                  >
                    <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    Re-Call (Chime)
                  </button>

                  <!-- Start Service -->
                  <button
                    type="button"
                    (click)="startService()"
                    [disabled]="current.status === 'IN_PROGRESS'"
                    class="p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
                  >
                    <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ current.status === 'IN_PROGRESS' ? 'In Progress' : 'Start Service' }}
                  </button>

                  <!-- Complete Service -->
                  <button
                    type="button"
                    (click)="completeService()"
                    class="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Complete Service
                  </button>

                  <!-- Skip / No Show -->
                  <button
                    type="button"
                    (click)="skipToken(current.id)"
                    class="p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all"
                  >
                    <svg class="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    Skip / No Show
                  </button>
                </div>
              </div>

              <!-- NO ACTIVE TOKEN CALLOUT -->
              <ng-template #noActiveToken>
                <div class="py-12 text-center space-y-4">
                  <div class="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-slate-800">Desk Currently Idle</h3>
                    <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Ready to accept the next visitor in line. Calling the next token will automatically sound the electronic chime.
                    </p>
                  </div>
                  <button
                    type="button"
                    (click)="callNextToken()"
                    class="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-lg shadow-amber-600/25 transition-all transform hover:-translate-y-0.5"
                  >
                    🔊 Call Next Token
                  </button>
                </div>
              </ng-template>

              <!-- Quick Next Button if currently serving -->
              <div *ngIf="queueState.currentServingToken" class="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  (click)="callNextToken()"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Complete & Call Next &rarr;
                </button>
              </div>
            </div>
          </div>

          <!-- WAITING QUEUE TABLE (Lg 1 Col) -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-slate-900">
                Waiting Visitors ({{ queueState.waitingTokens.length }})
              </h3>
              <button (click)="refreshQueue()" class="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                Refresh
              </button>
            </div>

            <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden max-h-[600px] overflow-y-auto">
              <div *ngIf="queueState.waitingTokens.length > 0; else emptyQueue" class="divide-y divide-slate-100">
                <div
                  *ngFor="let token of queueState.waitingTokens"
                  class="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-slate-100 font-mono font-bold text-xs text-slate-700 flex items-center justify-center shrink-0">
                      #{{ token.positionInQueue }}
                    </div>
                    <div>
                      <span class="text-sm font-bold font-mono text-slate-900 block leading-tight">
                        {{ token.tokenNumber }}
                      </span>
                      <span class="text-[11px] text-slate-500 truncate max-w-[120px] block">
                        {{ token.customerName }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <span class="text-[11px] font-semibold text-slate-400">
                      ~{{ token.estimatedWaitMinutes }}m
                    </span>
                    <button
                      (click)="skipToken(token.id)"
                      title="Skip Token"
                      class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              <ng-template #emptyQueue>
                <div class="p-8 text-center text-xs text-slate-400">
                  No visitors waiting in queue.
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class StaffDashboardComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private queueService = inject(QueueService);
  private toast = inject(ToastService);

  queueState!: LiveQueueState;
  selectedCounter = 'Counter 1';
  private pollSub?: Subscription;

  ngOnInit(): void {
    if (this.authService.currentUser?.counterAssigned) {
      this.selectedCounter = this.authService.currentUser.counterAssigned;
    }
    this.refreshQueue();
    this.pollSub = interval(6000).subscribe(() => this.refreshQueue(false));
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  refreshQueue(notify: boolean = true): void {
    this.queueService.getLiveQueueState().subscribe({
      next: (state) => {
        this.queueState = state;
      }
    });
  }

  callNextToken(): void {
    this.queueService.callNextToken(this.selectedCounter).subscribe({
      next: () => {
        this.refreshQueue(false);
      }
    });
  }

  recallToken(): void {
    this.queueService.recallCurrentToken();
  }

  startService(): void {
    this.queueService.startService().subscribe();
  }

  completeService(): void {
    this.queueService.completeService().subscribe({
      next: () => {
        this.refreshQueue(false);
      }
    });
  }

  skipToken(tokenId: string): void {
    this.queueService.skipToken(tokenId).subscribe({
      next: () => {
        this.refreshQueue(false);
      }
    });
  }
}
