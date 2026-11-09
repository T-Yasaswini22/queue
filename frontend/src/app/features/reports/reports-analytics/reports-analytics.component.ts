import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { AnalyticsReport } from '../../../core/models/report.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-reports-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, SidebarComponent],
  template: `
    <div class="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <app-sidebar class="hidden lg:block"></app-sidebar>

      <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
        <!-- HEADER -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest text-indigo-600">Operational Intelligence</span>
            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
              Reports & Queue Analytics
            </h1>
            <p class="text-xs text-slate-500 mt-1">
              Historical throughput analysis, staff counter performance, and wait-time diagnostics.
            </p>
          </div>

          <!-- Export Action -->
          <button
            (click)="exportCsv()"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-center"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Comprehensive CSV
          </button>
        </div>

        <div *ngIf="isLoading" class="py-16">
          <app-loading-spinner message="Calculating queue analytics..."></app-loading-spinner>
        </div>

        <div *ngIf="!isLoading && report" class="space-y-8">
          <!-- METRIC KPI CARDS -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs font-semibold text-slate-400 block">Today's Total Flow</span>
              <span class="text-3xl font-extrabold text-slate-900 mt-1 block">{{ report.summary.todayAppointments }}</span>
              <span class="text-[11px] text-emerald-600 font-bold">96% Completed on schedule</span>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs font-semibold text-slate-400 block">Average Wait Time</span>
              <span class="text-3xl font-extrabold text-indigo-600 mt-1 block">{{ report.summary.averageWaitTimeMinutes }} <span class="text-sm font-normal text-slate-500">min</span></span>
              <span class="text-[11px] text-slate-500">Benchmark: &lt; 20 min</span>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs font-semibold text-slate-400 block">Visitor Satisfaction</span>
              <span class="text-3xl font-extrabold text-amber-500 mt-1 block">★ {{ report.summary.satisfactionScore }} <span class="text-sm font-normal text-slate-400">/5</span></span>
              <span class="text-[11px] text-emerald-600 font-bold">Top 5% Facility Rating</span>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span class="text-xs font-semibold text-slate-400 block">Active Counter Desks</span>
              <span class="text-3xl font-extrabold text-blue-600 mt-1 block">{{ report.summary.activeCountersCount }}</span>
              <span class="text-[11px] text-slate-500">100% staff attendance</span>
            </div>
          </div>

          <!-- DAILY TREND CHART BAR VISUALIZATION -->
          <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 class="text-base font-bold text-slate-900">Weekly Appointment Volume & Completion Rate</h3>
                <p class="text-xs text-slate-500">Daily breakdown of appointments booked vs completed.</p>
              </div>
              <div class="flex items-center gap-4 text-xs font-semibold">
                <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-md bg-blue-600"></span> Bookings</span>
                <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-md bg-emerald-500"></span> Completed</span>
              </div>
            </div>

            <!-- CSS Bar Graph -->
            <div class="grid grid-cols-7 gap-2 sm:gap-4 items-end h-56 pt-6">
              <div *ngFor="let item of report.dailyTrend" class="flex flex-col items-center gap-2 h-full justify-end">
                <span class="text-[11px] font-bold text-slate-600">{{ item.totalAppointments }}</span>

                <div class="w-full flex items-end justify-center gap-1 h-40">
                  <!-- Total Bar -->
                  <div
                    class="w-1/2 bg-blue-600 rounded-t-lg transition-all duration-500 hover:bg-blue-700"
                    [style.height.%]="(item.totalAppointments / 120) * 100"
                    [title]="item.totalAppointments + ' Total'"
                  ></div>
                  <!-- Completed Bar -->
                  <div
                    class="w-1/2 bg-emerald-500 rounded-t-lg transition-all duration-500 hover:bg-emerald-600"
                    [style.height.%]="(item.completed / 120) * 100"
                    [title]="item.completed + ' Completed'"
                  ></div>
                </div>

                <span class="text-xs font-bold text-slate-700">{{ item.date }}</span>
              </div>
            </div>
          </div>

          <!-- SERVICE PERFORMANCE & STAFF PRODUCTIVITY TABLES -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Service Performance -->
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 class="text-base font-bold text-slate-900">Department Wait Time Breakdown</h3>
              <p class="text-xs text-slate-500">Comparison of average duration and customer satisfaction.</p>

              <div class="divide-y divide-slate-100">
                <div *ngFor="let sp of report.servicePerformance" class="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h4 class="font-bold text-slate-800">{{ sp.serviceName }}</h4>
                    <span class="text-[11px] text-slate-400">{{ sp.appointmentsCount }} consultations</span>
                  </div>
                  <div class="text-right">
                    <span class="font-bold text-indigo-600 block">{{ sp.avgWaitMinutes }} mins avg</span>
                    <span class="text-amber-500 font-semibold">★ {{ sp.satisfactionRating }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Staff Performance -->
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 class="text-base font-bold text-slate-900">Counter Staff Productivity</h3>
              <p class="text-xs text-slate-500">Tokens serviced today by each desk operator.</p>

              <div class="divide-y divide-slate-100">
                <div *ngFor="let staff of report.staffPerformance" class="py-3 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center">
                      {{ staff.staffName.charAt(0) }}
                    </div>
                    <div>
                      <h4 class="font-bold text-slate-800">{{ staff.staffName }}</h4>
                      <span class="text-[11px] text-slate-400">{{ staff.counterName }}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="font-bold text-emerald-600 block">{{ staff.tokensServed }} served</span>
                    <span class="text-slate-500 text-[11px]">{{ staff.avgServiceMinutes }} min/client</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class ReportsAnalyticsComponent implements OnInit {
  private reportService = inject(ReportService);

  report?: AnalyticsReport;
  isLoading = true;

  ngOnInit(): void {
    this.reportService.getAnalyticsReport().subscribe({
      next: (data) => {
        this.report = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  exportCsv(): void {
    this.reportService.exportReportCsv();
  }
}
