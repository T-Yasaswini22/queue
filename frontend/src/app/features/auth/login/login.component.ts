import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div class="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl">
        <!-- Brand Header -->
        <div class="text-center">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center mx-auto shadow-md">
            QL
          </div>
          <h2 class="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign In to QueueLess
          </h2>
          <p class="mt-2 text-xs text-slate-500">
            Access your appointments, live token trackers, and queue desk.
          </p>
        </div>

        <!-- One-click Demo Selector for easy testing -->
        <div class="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100">
          <span class="block text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-2 text-center">
            ⚡ Quick Demo Accounts (One Click)
          </span>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              (click)="fillDemo('USER')"
              class="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white text-slate-700 hover:text-blue-600 border border-blue-200 shadow-xs hover:border-blue-400 transition-all text-center"
            >
              👤 User
            </button>
            <button
              type="button"
              (click)="fillDemo('STAFF')"
              class="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white text-slate-700 hover:text-amber-600 border border-amber-200 shadow-xs hover:border-amber-400 transition-all text-center"
            >
              🩺 Staff
            </button>
            <button
              type="button"
              (click)="fillDemo('ADMIN')"
              class="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white text-slate-700 hover:text-indigo-600 border border-indigo-200 shadow-xs hover:border-indigo-400 transition-all text-center"
            >
              👑 Admin
            </button>
          </div>
        </div>

        <!-- Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-5">
          <!-- Email -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div class="relative">
              <input
                type="email"
                formControlName="email"
                placeholder="name@company.com"
                class="w-full px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                [ngClass]="loginForm.get('email')?.touched && loginForm.get('email')?.invalid ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'"
              />
            </div>
            <p *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.errors?.['required']" class="mt-1 text-xs text-rose-500 font-medium">
              Email is required.
            </p>
            <p *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.errors?.['email']" class="mt-1 text-xs text-rose-500 font-medium">
              Please enter a valid email.
            </p>
          </div>

          <!-- Password -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <span class="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                Forgot?
              </span>
            </div>
            <div class="relative">
              <input
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
                class="w-full px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                [ngClass]="loginForm.get('password')?.touched && loginForm.get('password')?.invalid ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'"
              />
              <button
                type="button"
                (click)="showPassword = !showPassword"
                class="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
            <p *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.errors?.['required']" class="mt-1 text-xs text-rose-500 font-medium">
              Password is required.
            </p>
          </div>

          <!-- Remember me -->
          <div class="flex items-center">
            <input
              id="remember"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label for="remember" class="ml-2 text-xs text-slate-600">
              Keep me signed in on this computer
            </label>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="loginForm.invalid || isLoading"
            class="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <svg *ngIf="isLoading" class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            {{ isLoading ? 'Authenticating...' : 'Sign In to Portal' }}
          </button>
        </form>

        <!-- Footer link to Register -->
        <div class="text-center pt-4 border-t border-slate-100">
          <p class="text-xs text-slate-500">
            Don't have an account yet?
            <a routerLink="/register" class="font-bold text-blue-600 hover:text-blue-800 ml-1">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  showPassword = false;
  isLoading = false;

  loginForm: FormGroup = this.fb.group({
    email: ['sarah.user@queueless.com', [Validators.required, Validators.email]],
    password: ['Password123!', [Validators.required, Validators.minLength(6)]]
  });

  fillDemo(role: UserRole): void {
    if (role === 'USER') {
      this.loginForm.patchValue({
        email: 'sarah.user@queueless.com',
        password: 'UserPass123!'
      });
    } else if (role === 'STAFF') {
      this.loginForm.patchValue({
        email: 'chen.staff@queueless.com',
        password: 'StaffPass123!'
      });
    } else if (role === 'ADMIN') {
      this.loginForm.patchValue({
        email: 'admin@queueless.com',
        password: 'AdminPass123!'
      });
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else if (res.user.role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else if (res.user.role === 'STAFF') {
          this.router.navigate(['/staff']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.error('Invalid credentials. Please verify your email and password.');
      }
    });
  }
}
