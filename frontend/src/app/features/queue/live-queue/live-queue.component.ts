import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QueueService } from '../../../core/services/queue.service';
import { ToastService } from '../../../core/services/toast.service';
import { LiveQueueState, QueueToken } from '../../../core/models/queue.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-live-queue',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto space-y-8">
        <!-- TOP BROADCAST HEADER -->
        <div class="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
              <span class="text-xs uppercase tracking-widest font-extrabold text-emerald-400">Live Electronic Broadcast</span>
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Public Queue Display Board
            </h1>
            <p class="text-xs text-slate-400 mt-1">
              Real-time counter calls and waiting status. Updates automatically every 5s.
            </p>
          </div>

          <!-- Controls: Sound Chime & Manual Refresh -->
          <div class="flex items-center gap-3">
            <button
              (click)="testChime()"
              title="Test notification chime sound"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Test Chime
            </button>

            <button
              (click)="refreshQueue()"
              [disabled]="isRefreshing"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all"
            >
              <svg class="w-4 h-4" [ngClass]="isRefreshing ? 'animate-spin' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Board
            </button>
          </div>
        </div>

        <!-- TOKEN LOOKUP RADAR SEARCH BAR -->
        <div class="bg-slate-800/80 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-slate-700/80 shadow-xl">
          <div class="flex flex-col sm:flex-row items-center gap-4">
            <div class="relative flex-1 w-full">
              <svg class="w-5 h-5 absolute left-4 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                [(ngModel)]="searchToken"
                (ngModelChange)="onSearchToken()"
                placeholder="Check your token status (e.g. MED-104 or PAS-314)..."
                class="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
              />
            </div>
            <button
              type="button"
              (click)="onSearchToken()"
              class="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition-colors"
            >
              Locate In Queue
            </button>
          </div>

          <!-- Search Match Result Card -->
          <div *ngIf="matchedToken" class="mt-4 p-4 rounded-2xl bg-blue-950/60 border border-blue-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-lg font-mono">
                {{ matchedToken.tokenNumber }}
              </div>
              <div>
                <h4 class="text-sm font-bold text-white">{{ matchedToken.serviceName }}</h4>
                <p class="text-xs text-blue-300">Registered to: {{ matchedToken.customerName }}</p>
              </div>
            </div>

            <div class="flex items-center gap-4 text-xs">
              <div class="text-center">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Position</span>
                <span class="text-base font-extrabold text-cyan-400">#{{ matchedToken.positionInQueue }}</span>
              </div>
              <div class="text-center">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Est. Wait</span>
                <span class="text-base font-extrabold text-amber-400">~{{ matchedToken.estimatedWaitMinutes }} mins</span>
              </div>
              <app-status-badge [status]="matchedToken.status"></app-status-badge>
            </div>
          </div>
        </div>

        <!-- MAIN ELECTRONIC BOARD DISPLAY -->
        <div *ngIf="queueState" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- NOW SERVING HERO CALLOUT (Lg 2 Cols) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Currently Serving Big Box -->
            <div class="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 rounded-3xl border-2 border-blue-500/50 shadow-2xl p-6 sm:p-10 relative overflow-hidden">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
                  <span class="text-xs font-black uppercase tracking-widest text-amber-400">ATTENTION: NOW SERVING</span>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Audio Alert Active
                </span>
              </div>

              <div *ngIf="queueState.currentServingToken as current; else noActiveCall" class="text-center py-6">
                <span class="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-2">Token Number</span>
                <div class="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight text-white text-shadow-glow animate-pulse-subtle">
                  {{ current.tokenNumber }}
                </div>

                <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <div class="px-5 py-2.5 rounded-2xl bg-amber-400 text-slate-950 font-black text-lg tracking-wide shadow-lg">
                    PROCEED TO: {{ current.counterAssigned }}
                  </div>
                </div>

                <div class="mt-4 text-sm text-slate-300 font-medium">
                  Service: <span class="font-bold text-white">{{ current.serviceName }}</span>
                  <span class="mx-2">•</span>
                  Visitor: <span class="font-bold text-white">{{ current.customerName }}</span>
                </div>
              </div>

              <ng-template #noActiveCall>
                <div class="py-12 text-center space-y-2">
                  <span class="text-4xl">⏳</span>
                  <h3 class="text-xl font-bold text-slate-300">All Counters Ready</h3>
                  <p class="text-xs text-slate-500">Staff will chime next token shortly.</p>
                </div>
              </ng-template>
            </div>

            <!-- Active Counters Grid -->
            <div>
              <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                Active Service Counters
              </h3>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div *ngFor="let counter of queueState.activeCounters; let i = index" class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div class="flex items-center justify-between text-xs mb-2">
                    <span class="text-slate-400 font-semibold">Counter {{ i + 1 }}</span>
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <h4 class="text-xs font-bold text-white truncate">{{ counter }}</h4>
                  <span class="mt-2 text-[10px] uppercase font-bold text-emerald-400 block">Serving Live</span>
                </div>
              </div>
            </div>
          </div>

          <!-- WAITING QUEUE LIST (Lg 1 Col) -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>Waiting In Line</span>
                <span class="px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 text-xs font-bold">
                  {{ queueState.waitingTokens.length }}
                </span>
              </h3>
              <span class="text-xs text-slate-400">Avg Wait: ~{{ queueState.averageWaitTimeMinutes }}m</span>
            </div>

            <div class="bg-slate-800/80 rounded-3xl border border-slate-700/80 overflow-hidden shadow-xl max-h-[600px] overflow-y-auto">
              <div *ngIf="queueState.waitingTokens.length > 0; else noWaiting" class="divide-y divide-slate-700/60">
                <div
                  *ngFor="let token of queueState.waitingTokens"
                  class="p-4 hover:bg-slate-700/40 transition-colors flex items-center justify-between gap-3"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-slate-700 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      #{{ token.positionInQueue }}
                    </div>
                    <div>
                      <span class="text-base font-extrabold text-white font-mono block leading-none">
                        {{ token.tokenNumber }}
                      </span>
                      <span class="text-[11px] text-slate-400 truncate max-w-[130px] block mt-1">
                        {{ token.serviceName }}
                      </span>
                    </div>
                  </div>

                  <div class="text-right">
                    <span class="text-xs font-bold text-amber-400 block">~{{ token.estimatedWaitMinutes }}m</span>
                    <span class="text-[10px] text-slate-400">{{ token.counterAssigned }}</span>
                  </div>
                </div>
              </div>

              <ng-template #noWaiting>
                <div class="p-8 text-center text-xs text-slate-500">
                  No visitors currently in queue line.
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LiveQueueComponent implements OnInit, OnDestroy {
  private queueService = inject(QueueService);
  private toast = inject(ToastService);

  queueState!: LiveQueueState;
  searchToken = '';
  matchedToken: QueueToken | null = null;
  isRefreshing = false;

  private pollSubscription?: Subscription;

  ngOnInit(): void {
    this.refreshQueue();

    // Auto refresh every 5 seconds
    this.pollSubscription = interval(5000).subscribe(() => {
      this.refreshQueue(false);
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  refreshQueue(showFeedback: boolean = true): void {
    if (showFeedback) this.isRefreshing = true;
    this.queueService.getLiveQueueState().subscribe({
      next: (state) => {
        this.queueState = state;
        this.isRefreshing = false;
        if (this.searchToken) {
          this.onSearchToken();
        }
      },
      error: () => {
        this.isRefreshing = false;
      }
    });
  }

  testChime(): void {
    this.queueService.playChime();
    this.toast.info('Ding! Notification tone played.', 'Audio Check');
  }

  onSearchToken(): void {
    if (!this.searchToken.trim() || !this.queueState) {
      this.matchedToken = null;
      return;
    }

    const q = this.searchToken.trim().toUpperCase();
    if (this.queueState.currentServingToken?.tokenNumber.toUpperCase() === q) {
      this.matchedToken = this.queueState.currentServingToken;
      return;
    }

    const match = this.queueState.waitingTokens.find(t => t.tokenNumber.toUpperCase() === q);
    this.matchedToken = match || null;

    if (!this.matchedToken) {
      this.toast.warning(`Token ${q} not found in today's active waiting queue.`);
    }
  }
}
