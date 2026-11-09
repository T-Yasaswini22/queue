import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ServiceService } from '../../core/services/service.service';
import { QueueService } from '../../core/services/queue.service';
import { AuthService } from '../../core/services/auth.service';
import { Service } from '../../core/models/service.model';
import { LiveQueueState } from '../../core/models/queue.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="relative overflow-hidden">
      <!-- HERO SECTION -->
      <section class="relative bg-gradient-to-b from-blue-50/70 via-white to-slate-50 pt-12 pb-20 md:pt-20 md:pb-28">
        <!-- Background decorative blobs -->
        <div class="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-blue-400/10 via-indigo-400/10 to-teal-400/10 blur-3xl pointer-events-none -z-10"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto space-y-6">
            <!-- Badge -->
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-semibold tracking-wide shadow-xs">
              <span class="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
              Next-Gen Queue & Appointment Architecture
            </div>

            <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Say Goodbye to Waiting in Lines with
              <span class="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                QueueLess
              </span>
            </h1>

            <p class="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Book digital appointments, track live counter progress in real time, and receive instant token alerts from anywhere. Experience seamless civil, clinical, and banking visits without the crowd.
            </p>

            <!-- CTA Buttons -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <a
                routerLink="/book"
                class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Book Appointment Now
              </a>

              <a
                routerLink="/live-queue"
                class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl shadow-sm transition-all"
              >
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                View Live Queue Board
              </a>
            </div>

            <!-- Trust badges -->
            <div class="pt-8 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-500">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Zero Physical Standing
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Real-Time Audio & SMS Chimes
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Average 78% Wait-Time Reduction
              </div>
            </div>
          </div>

          <!-- LIVE MINI PREVIEW CARD -->
          <div *ngIf="queueState$ | async as queue" class="mt-12 max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span class="text-xs font-bold uppercase tracking-widest text-emerald-600">Live Queue Radar</span>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mt-1">Real-Time Facility Flow</h3>
              </div>
              <a routerLink="/live-queue" class="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                Open Full Display Board &rarr;
              </a>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <!-- Serving Now -->
              <div class="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 flex flex-col justify-between">
                <span class="text-xs font-semibold uppercase tracking-wider text-blue-600">Now Serving</span>
                <div class="my-3">
                  <div class="text-4xl font-extrabold text-blue-700 tracking-tight">
                    {{ queue.currentServingToken?.tokenNumber || 'MED-104' }}
                  </div>
                  <p class="text-xs font-medium text-slate-600 mt-1">
                    {{ queue.currentServingToken?.serviceName || 'General Consultation' }}
                  </p>
                </div>
                <div class="text-xs font-bold text-blue-800 inline-flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-blue-600"></span>
                  At {{ queue.currentServingToken?.counterAssigned || 'Counter 1' }}
                </div>
              </div>

              <!-- Waiting Count -->
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">People Waiting</span>
                <div class="my-3">
                  <div class="text-4xl font-extrabold text-slate-800 tracking-tight">
                    {{ queue.waitingTokens.length }}
                  </div>
                  <p class="text-xs font-medium text-slate-500 mt-1">Active registered tickets in line</p>
                </div>
                <div class="text-xs text-slate-600">
                  Next in line: <span class="font-bold text-slate-800">{{ queue.waitingTokens[0]?.tokenNumber || 'MED-105' }}</span>
                </div>
              </div>

              <!-- Estimated Wait -->
              <div class="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex flex-col justify-between">
                <span class="text-xs font-semibold uppercase tracking-wider text-amber-700">Estimated Avg Wait</span>
                <div class="my-3">
                  <div class="text-4xl font-extrabold text-amber-800 tracking-tight">
                    ~{{ queue.averageWaitTimeMinutes }} <span class="text-lg font-bold text-amber-700">mins</span>
                  </div>
                  <p class="text-xs font-medium text-slate-500 mt-1">Calculated via counter cadence</p>
                </div>
                <div class="text-xs font-medium text-emerald-700 flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Counters running efficiently
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section class="py-20 bg-white border-y border-slate-200/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-2xl mx-auto mb-16">
            <h2 class="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Simplicity First</h2>
            <h3 class="text-3xl font-extrabold text-slate-900 tracking-tight">How QueueLess Operates</h3>
            <p class="mt-3 text-slate-600 text-sm">Four straightforward steps from booking to service completion.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center relative group hover:bg-blue-50/50 transition-colors">
              <div class="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                1
              </div>
              <h4 class="text-base font-bold text-slate-900 mb-2">Select Service</h4>
              <p class="text-xs text-slate-600 leading-relaxed">
                Choose from healthcare, passport renewal, banking, or legal verification desks.
              </p>
            </div>

            <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center relative group hover:bg-blue-50/50 transition-colors">
              <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                2
              </div>
              <h4 class="text-base font-bold text-slate-900 mb-2">Pick Time Slot</h4>
              <p class="text-xs text-slate-600 leading-relaxed">
                Choose a date and reserve a convenient 30-minute availability slot.
              </p>
            </div>

            <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center relative group hover:bg-blue-50/50 transition-colors">
              <div class="w-12 h-12 rounded-2xl bg-cyan-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                3
              </div>
              <h4 class="text-base font-bold text-slate-900 mb-2">Digital Token Pass</h4>
              <p class="text-xs text-slate-600 leading-relaxed">
                Instantly receive a digital token code and barcode directly on your mobile device.
              </p>
            </div>

            <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center relative group hover:bg-blue-50/50 transition-colors">
              <div class="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                4
              </div>
              <h4 class="text-base font-bold text-slate-900 mb-2">Live Alert & Call</h4>
              <p class="text-xs text-slate-600 leading-relaxed">
                Track your live queue position and walk up to the designated counter when chimed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURED SERVICES OVERVIEW -->
      <section class="py-20 bg-slate-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 class="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Available Departments</h2>
              <h3 class="text-3xl font-extrabold text-slate-900 tracking-tight">Services Ready for Fast Booking</h3>
              <p class="mt-2 text-slate-600 text-sm">Select any counter below to inspect wait times and schedule an appointment.</p>
            </div>
            <a routerLink="/services" class="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800">
              Explore All Services &rarr;
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              *ngFor="let service of (services$ | async)?.slice(0, 3)"
              class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div class="flex items-center justify-between mb-4">
                  <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-50 text-blue-700">
                    {{ service.category }}
                  </span>
                  <span class="text-xs font-semibold text-slate-500">
                    Prefix: <span class="font-bold text-slate-800">{{ service.counterPrefix }}</span>
                  </span>
                </div>

                <h4 class="text-lg font-bold text-slate-900 mb-2">{{ service.name }}</h4>
                <p class="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">{{ service.description }}</p>
              </div>

              <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span class="text-[11px] text-slate-400 block">Est. Duration</span>
                  <span class="text-xs font-bold text-slate-700">{{ service.durationMinutes }} mins</span>
                </div>
                <div class="text-right">
                  <span class="text-[11px] text-slate-400 block">Typical Wait</span>
                  <span class="text-xs font-bold text-amber-600">~{{ service.estimatedWaitMinutes }} mins</span>
                </div>
                <a
                  [routerLink]="['/book']"
                  [queryParams]="{ serviceId: service.id }"
                  class="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
                >
                  Book
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- TESTIMONIAL & TRUST STATS -->
      <section class="py-16 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div class="text-4xl font-extrabold text-cyan-400 mb-1">12,500+</div>
              <p class="text-xs text-blue-200 uppercase tracking-wider font-semibold">Tokens Processed</p>
            </div>
            <div>
              <div class="text-4xl font-extrabold text-cyan-400 mb-1">12 Mins</div>
              <p class="text-xs text-blue-200 uppercase tracking-wider font-semibold">Average Queue Wait</p>
            </div>
            <div>
              <div class="text-4xl font-extrabold text-cyan-400 mb-1">99.8%</div>
              <p class="text-xs text-blue-200 uppercase tracking-wider font-semibold">On-Time Accuracy</p>
            </div>
            <div>
              <div class="text-4xl font-extrabold text-cyan-400 mb-1">4.9 / 5</div>
              <p class="text-xs text-blue-200 uppercase tracking-wider font-semibold">User Satisfaction</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class HomeComponent implements OnInit {
  private serviceService = inject(ServiceService);
  private queueService = inject(QueueService);
  public authService = inject(AuthService);

  services$!: Observable<Service[]>;
  queueState$!: Observable<LiveQueueState>;

  ngOnInit(): void {
    this.services$ = this.serviceService.getServices();
    this.queueState$ = this.queueService.getLiveQueueState();
  }
}
