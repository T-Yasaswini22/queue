import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FeedbackService } from '../../../core/services/feedback.service';
import { ServiceService } from '../../../core/services/service.service';
import { ToastService } from '../../../core/services/toast.service';
import { Service } from '../../../core/models/service.model';

@Component({
  selector: 'app-feedback-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-xl mx-auto space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl">
        <!-- Header -->
        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold shadow-xs">
            ★
          </div>
          <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">
            How Was Your Counter Visit?
          </h2>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">
            Your anonymous rating directly helps our staff optimize counter queue cadences and waiting times.
          </p>
        </div>

        <form [formGroup]="feedbackForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- STAR RATING PICKER -->
          <div class="text-center space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Overall Experience Rating *
            </label>
            <div class="flex items-center justify-center gap-2">
              <button
                *ngFor="let star of [1, 2, 3, 4, 5]"
                type="button"
                (click)="setRating(star)"
                class="text-3xl sm:text-4xl transition-transform hover:scale-125 focus:outline-none"
                [ngClass]="selectedRating >= star ? 'text-amber-400' : 'text-slate-200'"
              >
                ★
              </button>
            </div>
            <span class="text-xs font-bold text-slate-600">
              {{ ratingLabels[selectedRating] || 'Tap stars to rate' }}
            </span>
          </div>

          <!-- WAIT TIME SATISFACTION -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Queue Wait-Time Satisfaction *
            </label>
            <div class="grid grid-cols-4 gap-2">
              <button
                *ngFor="let option of waitOptions"
                type="button"
                (click)="feedbackForm.patchValue({ waitSatisfaction: option.value })"
                class="p-2.5 rounded-xl border text-xs font-bold transition-all text-center"
                [ngClass]="feedbackForm.get('waitSatisfaction')?.value === option.value ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <!-- QUICK TAGS -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Highlight Highlights (Select all that apply)
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                *ngFor="let tag of availableTags"
                type="button"
                (click)="toggleTag(tag)"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                [ngClass]="selectedTags.includes(tag) ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'"
              >
                {{ selectedTags.includes(tag) ? '✓ ' : '+ ' }}{{ tag }}
              </button>
            </div>
          </div>

          <!-- COMMENT -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Detailed Comments & Suggestions
            </label>
            <textarea
              rows="4"
              formControlName="comment"
              placeholder="Tell us about the counter service, staff courtesy, audio clarity, or digital pass convenience..."
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <!-- ACTIONS -->
          <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
            <a
              routerLink="/my-appointments"
              class="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Skip for Now
            </a>

            <button
              type="submit"
              [disabled]="feedbackForm.invalid || isSubmitting"
              class="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              <svg *ngIf="isSubmitting" class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Submit Rating & Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class FeedbackFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private feedbackService = inject(FeedbackService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  appointmentId = '';
  serviceId = 'srv-001';
  selectedRating = 5;
  isSubmitting = false;

  ratingLabels: Record<number, string> = {
    1: '1/5 - Very Dissatisfied',
    2: '2/5 - Needs Improvement',
    3: '3/5 - Average Experience',
    4: '4/5 - Great & Prompt',
    5: '5/5 - Outstanding Service!'
  };

  waitOptions = [
    { label: 'Poor', value: 'POOR' },
    { label: 'Average', value: 'AVERAGE' },
    { label: 'Good', value: 'GOOD' },
    { label: 'Excellent', value: 'EXCELLENT' }
  ];

  availableTags = [
    'Fast Service',
    'Helpful Staff',
    'Accurate Wait Time',
    'Clean Facility',
    'Easy Digital Check-In',
    'Clear Audio Chime'
  ];
  selectedTags: string[] = ['Fast Service', 'Accurate Wait Time'];

  feedbackForm: FormGroup = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    waitSatisfaction: ['EXCELLENT', Validators.required],
    comment: ['', [Validators.required, Validators.minLength(5)]]
  });

  ngOnInit(): void {
    this.appointmentId = this.route.snapshot.queryParams['appointmentId'] || 'apt-003';
    this.serviceId = this.route.snapshot.queryParams['serviceId'] || 'srv-001';
  }

  setRating(stars: number): void {
    this.selectedRating = stars;
    this.feedbackForm.patchValue({ rating: stars });
  }

  toggleTag(tag: string): void {
    if (this.selectedTags.includes(tag)) {
      this.selectedTags = this.selectedTags.filter(t => t !== tag);
    } else {
      this.selectedTags.push(tag);
    }
  }

  onSubmit(): void {
    if (this.feedbackForm.invalid) {
      this.feedbackForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.feedbackForm.value;

    this.feedbackService.submitFeedback({
      appointmentId: this.appointmentId,
      serviceId: this.serviceId,
      rating: formVal.rating,
      waitSatisfaction: formVal.waitSatisfaction,
      comment: formVal.comment,
      tags: this.selectedTags
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/my-appointments']);
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }
}
