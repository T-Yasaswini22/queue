import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Col 1: Brand -->
          <div class="space-y-4 md:col-span-1">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                QL
              </div>
              <span class="text-lg font-bold text-white tracking-tight">QueueLess</span>
            </div>
            <p class="text-xs text-slate-400 leading-relaxed">
              Enterprise digital appointment management, queue optimization, and paperless token dispatching system.
            </p>
            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-[11px] text-emerald-400">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All Queue Counters Operational
            </div>
          </div>

          <!-- Col 2: Services -->
          <div>
            <h4 class="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Service Sectors</h4>
            <ul class="space-y-2 text-xs">
              <li><a routerLink="/services" class="hover:text-white transition-colors">Healthcare & Clinics</a></li>
              <li><a routerLink="/services" class="hover:text-white transition-colors">Civil & Passport Counters</a></li>
              <li><a routerLink="/services" class="hover:text-white transition-colors">Financial Advisory</a></li>
              <li><a routerLink="/services" class="hover:text-white transition-colors">Legal & Document Attestation</a></li>
            </ul>
          </div>

          <!-- Col 3: Portal Links -->
          <div>
            <h4 class="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Portals & Tools</h4>
            <ul class="space-y-2 text-xs">
              <li><a routerLink="/live-queue" class="hover:text-white transition-colors">Live Queue Board</a></li>
              <li><a routerLink="/book" class="hover:text-white transition-colors">Book Digital Appointment</a></li>
              <li><a routerLink="/my-appointments" class="hover:text-white transition-colors">My Appointments</a></li>
              <li><a routerLink="/staff" class="hover:text-white transition-colors">Staff Counter Desk</a></li>
              <li><a routerLink="/admin" class="hover:text-white transition-colors">Admin Management</a></li>
            </ul>
          </div>

          <!-- Col 4: Operational Info -->
          <div>
            <h4 class="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Service Hours</h4>
            <p class="text-xs text-slate-400">Monday - Friday: 08:30 AM – 05:00 PM</p>
            <p class="text-xs text-slate-400">Saturday: 09:00 AM – 02:00 PM</p>
            <p class="text-xs text-slate-500 mt-2">API Backend Endpoint: http://localhost:5000/api</p>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 QueueLess Technologies Inc. All rights reserved.</p>
          <div class="flex items-center gap-4">
            <span class="hover:text-slate-400 cursor-pointer">Security Protocol</span>
            <span class="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span class="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}
