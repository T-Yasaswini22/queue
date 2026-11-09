import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div class="max-w-lg w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl">
        <div class="text-center">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center mx-auto shadow-md">
            QL
          </div>
          <h2 class="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
            Create QueueLess Account
          </h2>
          <p class="mt-2 text-xs text-slate-500">
            Join thousands skipping waiting rooms with smart digital queue appointments.
          </p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-6 space-y-4">
          <!-- Full Name -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g. Jane Doe"
              class="w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              [ngClass]="registerForm.get('name')?.touched && registerForm.get('name')?.invalid ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'"
            />
            <p *ngIf="registerForm.get('name')?.touched && registerForm.get('name')?.errors?.['required']" class="mt-1 text-xs text-rose-500 font-medium">
              Full name is required.
            </p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              formControlName="email"
              placeholder="jane@example.com"
              class="w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              [ngClass]="registerForm.get('email')?.touched && registerForm.get('email')?.invalid ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'"
            />
            <p *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.errors?.['required']" class="mt-1 text-xs text-rose-500 font-medium">
              Email is required.
            </p>
          </div>

          <!-- Phone & Role Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                formControlName="phone"
                placeholder="+1 (555) 000-0000"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Account Type
              </label>
              <select
                formControlName="role"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="USER">Patient / Visitor (USER)</option>
                <option value="STAFF">Counter Operator (STAFF)</option>
                <option value="ADMIN">Facility Supervisor (ADMIN)</option>
              </select>
            </div>
          </div>

          <!-- Password & Confirm Password -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <input
                type="password"
                formControlName="password"
                placeholder="Min 6 chars"
                class="w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                [ngClass]="registerForm.get('password')?.touched && registerForm.get('password')?.invalid ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                formControlName="confirmPassword"
                placeholder="Re-enter"
                class="w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                [ngClass]="passwordMismatch ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'"
              />
            </div>
          </div>
          <p *ngIf="passwordMismatch" class="text-xs text-rose-500 font-medium">
            Passwords do not match.
          </p>

          <!-- Terms -->
          <div class="flex items-start">
            <input
              id="terms"
              type="checkbox"
              formControlName="agreeTerms"
              class="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label for="terms" class="ml-2 text-xs text-slate-600 leading-snug">
              I agree to the QueueLess Service Protocols, digital token terms, and privacy guidelines.
            </label>
          </div>
          <p *ngIf="registerForm.get('agreeTerms')?.touched && registerForm.get('agreeTerms')?.invalid" class="text-xs text-rose-500 font-medium">
            You must agree to the terms to continue.
          </p>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="registerForm.invalid || passwordMismatch || isLoading"
            class="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <svg *ngIf="isLoading" class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            {{ isLoading ? 'Creating Account...' : 'Complete Registration' }}
          </button>
        </form>

        <div class="text-center pt-4 border-t border-slate-100">
          <p class="text-xs text-slate-500">
            Already have an account?
            <a routerLink="/login" class="font-bold text-blue-600 hover:text-blue-800 ml-1">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  isLoading = false;

  registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    role: ['USER', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    agreeTerms: [true, Validators.requiredTrue]
  });

  get passwordMismatch(): boolean {
    const p1 = this.registerForm.get('password')?.value;
    const p2 = this.registerForm.get('confirmPassword')?.value;
    return !!p2 && p1 !== p2;
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.passwordMismatch) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { name, email, phone, role, password } = this.registerForm.value;

    this.authService.register({ name, email, phone, role, password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.user.role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else if (res.user.role === 'STAFF') {
          this.router.navigate(['/staff']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Could not complete registration. Please try again.');
      }
    });
  }
}
