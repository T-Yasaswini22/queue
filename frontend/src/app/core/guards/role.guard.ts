import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const expectedRoles = (route.data['roles'] as UserRole[]) || [];

  if (!authService.isAuthenticated()) {
    toast.warning('Please log in to continue.');
    router.navigate(['/login']);
    return false;
  }

  const userRole = authService.getUserRole();
  if (userRole && expectedRoles.includes(userRole)) {
    return true;
  }

  toast.error(`Access restricted. Requires ${expectedRoles.join(' or ')} permission.`);
  router.navigate(['/dashboard']);
  return false;
};
