import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-8">
            <a routerLink="/" class="flex items-center gap-2.5 group">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex flex-col">
                <span class="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-900 bg-clip-text text-transparent">
                  QueueLess
                </span>
                <span class="text-[10px] uppercase tracking-wider font-semibold text-slate-400 -mt-1">Digital Appointments</span>
              </div>
            </a>

            <!-- Desktop Nav Links -->
            <nav class="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
              <a routerLink="/" routerLinkActive="text-blue-600 bg-blue-50/70" [routerLinkActiveOptions]="{ exact: true }" class="px-3 py-1.5 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors">
                Home
              </a>
              <a routerLink="/services" routerLinkActive="text-blue-600 bg-blue-50/70" class="px-3 py-1.5 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors">
                Services
              </a>
              <ng-container *ngIf="authService.isAuthenticated()">
                <a routerLink="/dashboard" routerLinkActive="text-blue-600 bg-blue-50/70" class="px-3 py-1.5 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors">
                  Dashboard
                </a>
                <a *ngIf="authService.isStaff() || authService.isAdmin()" routerLink="/staff" routerLinkActive="text-blue-600 bg-blue-50/70" class="px-3 py-1.5 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors text-amber-700 font-semibold">
                  Staff Desk
                </a>
                <a *ngIf="authService.isAdmin()" routerLink="/admin" routerLinkActive="text-blue-600 bg-blue-50/70" class="px-3 py-1.5 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors text-indigo-700 font-semibold">
                  Admin Portal
                </a>
                <a *ngIf="authService.isAdmin() || authService.isStaff()" routerLink="/reports" routerLinkActive="text-blue-600 bg-blue-50/70" class="px-3 py-1.5 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors">
                  Analytics
                </a>
              </ng-container>
            </nav>
          </div>

          <!-- Right side items: Demo Switcher & Auth state -->
          <div class="flex items-center gap-3">
            <!-- Quick Demo Role Switcher Badge -->
            <div class="hidden xl:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600 border border-slate-200">
              <span class="px-2 text-[11px] text-slate-400 uppercase font-bold tracking-wider">Demo:</span>
              <button
                (click)="switchDemoRole('USER')"
                class="px-2.5 py-1 rounded-lg transition-all"
                [ngClass]="authService.getUserRole() === 'USER' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'hover:text-slate-900'"
              >
                User
              </button>
              <button
                (click)="switchDemoRole('STAFF')"
                class="px-2.5 py-1 rounded-lg transition-all"
                [ngClass]="authService.getUserRole() === 'STAFF' ? 'bg-white text-amber-700 shadow-xs font-semibold' : 'hover:text-slate-900'"
              >
                Staff
              </button>
              <button
                (click)="switchDemoRole('ADMIN')"
                class="px-2.5 py-1 rounded-lg transition-all"
                [ngClass]="authService.getUserRole() === 'ADMIN' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'hover:text-slate-900'"
              >
                Admin
              </button>
            </div>

            <!-- Book appointment CTA -->
            <a
              routerLink="/book"
              class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Book Token
            </a>

            <!-- Authenticated Profile Dropdown / Login Button -->
            <div *ngIf="authService.currentUser$ | async as user; else unauth">
              <div class="flex items-center gap-2 pl-2 border-l border-slate-200">
                <a routerLink="/profile" class="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {{ user.name.charAt(0) }}
                  </div>
                  <div class="hidden lg:flex flex-col text-left">
                    <span class="text-xs font-semibold text-slate-800 leading-tight">{{ user.name }}</span>
                    <span class="text-[10px] font-medium text-slate-500 uppercase">{{ user.role }}</span>
                  </div>
                </a>

                <button
                  (click)="authService.logout()"
                  title="Logout"
                  class="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>

            <ng-template #unauth>
              <div class="flex items-center gap-2">
                <a routerLink="/login" class="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                  Log In
                </a>
                <a routerLink="/register" class="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors">
                  Register
                </a>
              </div>
            </ng-template>

            <!-- Mobile menu button -->
            <button
              (click)="isMobileMenuOpen = !isMobileMenuOpen"
              class="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <svg *ngIf="!isMobileMenuOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg *ngIf="isMobileMenuOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile dropdown -->
      <div *ngIf="isMobileMenuOpen" class="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <span class="text-xs font-semibold text-slate-500">Quick Role Switch:</span>
          <div class="flex gap-1">
            <button (click)="switchDemoRole('USER')" class="px-2 py-1 text-xs rounded bg-slate-100">User</button>
            <button (click)="switchDemoRole('STAFF')" class="px-2 py-1 text-xs rounded bg-slate-100">Staff</button>
            <button (click)="switchDemoRole('ADMIN')" class="px-2 py-1 text-xs rounded bg-slate-100">Admin</button>
          </div>
        </div>

        <a (click)="isMobileMenuOpen = false" routerLink="/" class="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600">Home</a>
        <a (click)="isMobileMenuOpen = false" routerLink="/services" class="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600">Services</a>
        <a (click)="isMobileMenuOpen = false" routerLink="/book" class="block px-3 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50">Book New Appointment</a>

        <ng-container *ngIf="authService.isAuthenticated()">
          <a (click)="isMobileMenuOpen = false" routerLink="/dashboard" class="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50">My Dashboard</a>
          <a *ngIf="authService.isStaff() || authService.isAdmin()" (click)="isMobileMenuOpen = false" routerLink="/staff" class="block px-3 py-2 rounded-xl text-sm font-medium text-amber-700 bg-amber-50">Staff Queue Desk</a>
          <a *ngIf="authService.isAdmin()" (click)="isMobileMenuOpen = false" routerLink="/admin" class="block px-3 py-2 rounded-xl text-sm font-medium text-indigo-700 bg-indigo-50">Admin Portal</a>
          <a *ngIf="authService.isAdmin() || authService.isStaff()" (click)="isMobileMenuOpen = false" routerLink="/reports" class="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50">Analytics & Reports</a>
          <a (click)="isMobileMenuOpen = false" routerLink="/profile" class="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50">My Profile</a>
          <button (click)="authService.logout(); isMobileMenuOpen = false" class="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50">Log Out</button>
        </ng-container>
      </div>
    </header>
  `
})
export class HeaderComponent {
  authService = inject(AuthService);
  isMobileMenuOpen = false;

  switchDemoRole(role: UserRole): void {
    this.authService.loginWithDemoRole(role);
  }
}
