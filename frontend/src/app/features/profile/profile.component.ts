import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SidebarComponent],
  template: `
    <div class="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <app-sidebar class="hidden lg:block"></app-sidebar>

      <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-8">
        <!-- HEADER -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest text-blue-600">Account Preferences</span>
            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
              My Profile & Settings
            </h1>
            <p class="text-xs text-slate-500 mt-1">
              Manage personal details, contact numbers for token SMS, and notification preferences.
            </p>
          </div>

          <button
            type="button"
            (click)="onLogout()"
            class="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors self-start sm:self-center"
          >
            Log Out of Session
          </button>
        </div>

        <!-- PROFILE CARD -->
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
          <div class="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
              {{ authService.currentUser?.name?.charAt(0) || 'U' }}
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900">{{ authService.currentUser?.name }}</h2>
              <p class="text-xs text-slate-500">{{ authService.currentUser?.email }}</p>
              <span
                class="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                [ngClass]="{
                  'bg-blue-100 text-blue-800': authService.currentUser?.role === 'USER',
                  'bg-amber-100 text-amber-800': authService.currentUser?.role === 'STAFF',
                  'bg-indigo-100 text-indigo-800': authService.currentUser?.role === 'ADMIN'
                }"
              >
                Role: {{ authService.currentUser?.role }}
              </span>
            </div>
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="onSaveProfile()" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  formControlName="name"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address (Verified)
                </label>
                <input
                  type="email"
                  [value]="authService.currentUser?.email"
                  disabled
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mobile Number (For SMS Call alerts)
                </label>
                <input
                  type="tel"
                  formControlName="phone"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div *ngIf="authService.isStaff() || authService.isAdmin()">
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Department / Unit
                </label>
                <input
                  type="text"
                  formControlName="department"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <!-- NOTIFICATION PREFERENCES -->
            <div class="pt-4 border-t border-slate-100 space-y-3">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">Token Broadcast Preferences</h3>

              <div class="space-y-2 text-xs">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked class="w-4 h-4 text-blue-600 rounded" />
                  <span class="text-slate-700 font-medium">Send SMS notifications when token is 2 positions away</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked class="w-4 h-4 text-blue-600 rounded" />
                  <span class="text-slate-700 font-medium">Play browser audio chime when token is announced</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked class="w-4 h-4 text-blue-600 rounded" />
                  <span class="text-slate-700 font-medium">Email appointment confirmation & downloadable QR pass</span>
                </label>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                [disabled]="profileForm.invalid || isSaving"
                class="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                {{ isSaving ? 'Saving...' : 'Save Profile Changes' }}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  isSaving = false;

  profileForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    phone: [''],
    department: ['']
  });

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        phone: user.phone || '',
        department: user.department || ''
      });
    }
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSaving = true;
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.success('Profile details updated successfully');
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
  }
}
