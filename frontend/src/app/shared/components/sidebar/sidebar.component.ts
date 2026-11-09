import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: string[];
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div class="space-y-6">
        <!-- User summary card in sidebar -->
        <div *ngIf="authService.currentUser$ | async as user" class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            {{ user.name.charAt(0) }}
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="text-xs font-bold text-slate-800 truncate">{{ user.name }}</h4>
            <span
              class="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md"
              [ngClass]="{
                'bg-blue-100 text-blue-700': user.role === 'USER',
                'bg-amber-100 text-amber-700': user.role === 'STAFF',
                'bg-indigo-100 text-indigo-700': user.role === 'ADMIN'
              }"
            >
              {{ user.role }}
            </span>
          </div>
        </div>

        <!-- Navigation group -->
        <nav class="space-y-1">
          <div class="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>

          <!-- Common / User Links -->
          <a
            routerLink="/dashboard"
            routerLinkActive="bg-blue-50 text-blue-700 font-semibold border-r-4 border-blue-600"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            User Dashboard
          </a>

          <a
            routerLink="/my-appointments"
            routerLinkActive="bg-blue-50 text-blue-700 font-semibold border-r-4 border-blue-600"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            My Appointments
          </a>

          <a
            routerLink="/book"
            routerLinkActive="bg-blue-50 text-blue-700 font-semibold border-r-4 border-blue-600"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Book Appointment
          </a>

          <a
            routerLink="/live-queue"
            routerLinkActive="bg-blue-50 text-blue-700 font-semibold border-r-4 border-blue-600"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Live Queue Tracker
          </a>

          <!-- Staff Desk -->
          <ng-container *ngIf="authService.isStaff() || authService.isAdmin()">
            <div class="pt-4 pb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Operations
            </div>
            <a
              routerLink="/staff"
              routerLinkActive="bg-amber-50 text-amber-800 font-semibold border-r-4 border-amber-600"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              Staff Queue Desk
            </a>
          </ng-container>

          <!-- Admin Portal -->
          <ng-container *ngIf="authService.isAdmin()">
            <div class="pt-4 pb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Management
            </div>
            <a
              routerLink="/admin"
              routerLinkActive="bg-indigo-50 text-indigo-800 font-semibold border-r-4 border-indigo-600"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Admin Dashboard
            </a>
            <a
              routerLink="/reports"
              routerLinkActive="bg-indigo-50 text-indigo-800 font-semibold border-r-4 border-indigo-600"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              </svg>
              Reports & Analytics
            </a>
          </ng-container>

          <div class="pt-4 pb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Account
          </div>
          <a
            routerLink="/profile"
            routerLinkActive="bg-blue-50 text-blue-700 font-semibold border-r-4 border-blue-600"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Profile
          </a>
        </nav>
      </div>

      <!-- Quick stats box at bottom of sidebar -->
      <div class="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
        <div class="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
          <span>Active System Status</span>
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <p class="text-[11px] text-slate-500">All counters connected to queue engine.</p>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  authService = inject(AuthService);
}
