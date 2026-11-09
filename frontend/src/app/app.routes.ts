import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'QueueLess - Digital Appointment & Queue System'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Login - QueueLess'
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Register - QueueLess'
  },
  {
    path: 'services',
    loadComponent: () => import('./features/services/service-list/service-list.component').then(m => m.ServiceListComponent),
    title: 'Services Directory - QueueLess'
  },
  {
    path: 'services/:id',
    loadComponent: () => import('./features/services/service-detail/service-detail.component').then(m => m.ServiceDetailComponent),
    title: 'Service Details - QueueLess'
  },
  {
    path: 'live-queue',
    loadComponent: () => import('./features/queue/live-queue/live-queue.component').then(m => m.LiveQueueComponent),
    title: 'Live Queue Broadcast - QueueLess'
  },
  {
    path: 'book',
    canActivate: [authGuard],
    loadComponent: () => import('./features/appointments/booking/booking.component').then(m => m.BookingComponent),
    title: 'Book Appointment - QueueLess'
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/user-dashboard/user-dashboard.component').then(m => m.UserDashboardComponent),
    title: 'Dashboard - QueueLess'
  },
  {
    path: 'my-appointments',
    canActivate: [authGuard],
    loadComponent: () => import('./features/appointments/my-appointments/my-appointments.component').then(m => m.MyAppointmentsComponent),
    title: 'My Appointments - QueueLess'
  },
  {
    path: 'token-display/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/queue/token-display/token-display.component').then(m => m.TokenDisplayComponent),
    title: 'Digital Token Pass - QueueLess'
  },
  {
    path: 'feedback',
    canActivate: [authGuard],
    loadComponent: () => import('./features/feedback/feedback-form/feedback-form.component').then(m => m.FeedbackFormComponent),
    title: 'Service Feedback - QueueLess'
  },
  {
    path: 'staff',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['STAFF', 'ADMIN'] },
    loadComponent: () => import('./features/staff/staff-dashboard/staff-dashboard.component').then(m => m.StaffDashboardComponent),
    title: 'Staff Queue Terminal - QueueLess'
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    title: 'Admin Management Hub - QueueLess'
  },
  {
    path: 'reports',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['STAFF', 'ADMIN'] },
    loadComponent: () => import('./features/reports/reports-analytics/reports-analytics.component').then(m => m.ReportsAnalyticsComponent),
    title: 'Analytics & Reports - QueueLess'
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    title: 'My Profile - QueueLess'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
