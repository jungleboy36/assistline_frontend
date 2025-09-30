import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import {jwtDecode} from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  userRole : string | null = null;
  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    console.log('Checking route access...');

    try {
      const session = await this.authService.checkSession().toPromise();

      const expectedRole = route.data['expectedRole'] as string[];
      const userRole = session?.role;

      console.log('Expected role:', expectedRole);
      console.log('User role:', userRole);

      if (userRole && expectedRole.includes(userRole)) {
        console.log('Access granted');
        return true;
      } else {
        console.log('Access denied');
        this.handleForbiddenAccess(userRole);
        return false;
      }
    } catch (err) {
      console.log('User not logged in or session expired. Redirecting to login...');
      this.router.navigate(['/login']);
      return false;
    }
  }

  handleForbiddenAccess(userRole: string): void {
    if (userRole === 'admin') {
      this.router.navigate(['/admin/companies']);
    } else if (userRole === 'particulier' || userRole === 'professionnel') {
      this.router.navigate(['/offers']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
