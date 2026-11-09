import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentStatus } from '../../../core/models/appointment.model';
import { TokenStatus } from '../../../core/models/queue.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase shadow-sm"
      [ngClass]="badgeClass"
    >
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="dotClass"></span>
      {{ label }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status: AppointmentStatus | TokenStatus | string = 'PENDING';

  get label(): string {
    return this.status.replace('_', ' ');
  }

  get badgeClass(): string {
    switch (this.status) {
      case 'CONFIRMED':
      case 'WAITING':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'CALLED':
        return 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse';
      case 'IN_PROGRESS':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'CANCELLED':
      case 'SKIPPED':
      case 'NO_SHOW':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'PENDING':
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  }

  get dotClass(): string {
    switch (this.status) {
      case 'CONFIRMED':
      case 'WAITING':
        return 'bg-blue-500';
      case 'CALLED':
        return 'bg-amber-500 animate-ping';
      case 'IN_PROGRESS':
        return 'bg-indigo-500';
      case 'COMPLETED':
        return 'bg-emerald-500';
      case 'CANCELLED':
      case 'SKIPPED':
      case 'NO_SHOW':
        return 'bg-rose-500';
      case 'PENDING':
      default:
        return 'bg-slate-400';
    }
  }
}
