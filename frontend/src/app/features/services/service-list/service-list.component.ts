import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceService } from '../../../core/services/service.service';
import { Service, ServiceCategory } from '../../../core/models/service.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto space-y-8">
        <!-- Title & Subtitle -->
        <div class="text-center max-w-2xl mx-auto space-y-2">
          <span class="text-xs font-bold uppercase tracking-widest text-blue-600">Available Counters</span>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Services & Department Directory
          </h1>
          <p class="text-sm text-slate-600">
            Select a service to review document requirements, counter wait cadences, and book your digital token.
          </p>
        </div>

        <!-- SEARCH AND FILTER CONTROLS -->
        <div class="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <!-- Search input -->
          <div class="relative w-full md:w-96">
            <svg class="w-5 h-5 absolute left-3.5 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange()"
              placeholder="Search services, prefixes, or departments..."
              class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <!-- Category Pills -->
          <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              *ngFor="let cat of categories"
              (click)="selectCategory(cat)"
              class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              [ngClass]="selectedCategory === cat ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- SERVICES GRID -->
        <div *ngIf="isLoading" class="py-12">
          <app-loading-spinner message="Loading available services..."></app-loading-spinner>
        </div>

        <div *ngIf="!isLoading && filteredServices.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            *ngFor="let service of filteredServices"
            class="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
          >
            <div class="p-6 space-y-4">
              <!-- Top Row: Category & Prefix -->
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
                  {{ service.category }}
                </span>
                <span class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Prefix: {{ service.counterPrefix }}
                </span>
              </div>

              <!-- Name & Description -->
              <div>
                <h3 class="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {{ service.name }}
                </h3>
                <p class="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {{ service.description }}
                </p>
              </div>

              <!-- Meta info pills -->
              <div class="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span class="text-slate-400 block text-[11px]">Duration</span>
                  <span class="font-bold text-slate-700">~{{ service.durationMinutes }} mins</span>
                </div>
                <div class="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span class="text-amber-700 block text-[11px]">Current Wait</span>
                  <span class="font-bold text-amber-800">~{{ service.estimatedWaitMinutes }} mins</span>
                </div>
              </div>

              <!-- Service Requirements Preview -->
              <div *ngIf="service.requirements && service.requirements.length > 0" class="pt-2">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Required Documents
                </span>
                <div class="flex flex-wrap gap-1">
                  <span
                    *ngFor="let req of service.requirements.slice(0, 2)"
                    class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]"
                  >
                    ✓ {{ req }}
                  </span>
                  <span *ngIf="service.requirements.length > 2" class="text-[11px] text-slate-400">
                    +{{ service.requirements.length - 2 }} more
                  </span>
                </div>
              </div>
            </div>

            <!-- Bottom Action Footer -->
            <div class="p-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
              <a
                [routerLink]="['/services', service.id]"
                class="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                View Details
              </a>

              <a
                [routerLink]="['/book']"
                [queryParams]="{ serviceId: service.id }"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
              >
                Book Now &rarr;
              </a>
            </div>
          </div>
        </div>

        <div *ngIf="!isLoading && filteredServices.length === 0" class="py-12">
          <app-empty-state
            title="No matching services found"
            description="Try modifying your search keywords or switching category filters."
            actionLabel="Reset Filters"
            (actionClick)="resetFilters()"
          ></app-empty-state>
        </div>
      </div>
    </div>
  `
})
export class ServiceListComponent implements OnInit {
  private serviceService = inject(ServiceService);

  services: Service[] = [];
  filteredServices: Service[] = [];
  categories: string[] = ['All', 'Healthcare', 'Government & Civil', 'Financial Services', 'Legal Services'];
  selectedCategory = 'All';
  searchTerm = '';
  isLoading = true;

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.isLoading = true;
    this.serviceService.getServices().subscribe({
      next: (data) => {
        this.services = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  selectCategory(cat: string): void {
    this.selectedCategory = cat;
    this.applyFilter();
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    let list = [...this.services];

    if (this.selectedCategory !== 'All') {
      list = list.filter(s => s.category.toLowerCase() === this.selectedCategory.toLowerCase());
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.counterPrefix.toLowerCase().includes(q)
      );
    }

    this.filteredServices = list;
  }

  resetFilters(): void {
    this.selectedCategory = 'All';
    this.searchTerm = '';
    this.applyFilter();
  }
}
