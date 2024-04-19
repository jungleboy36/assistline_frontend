import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import {jwtDecode} from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    console.log('Checking route access...');

    // Check if the user is logged in
    if (this.authService.isLoggedIn()) {
        // Retrieve the expected role from the route data
        const expectedRole = route.data['expectedRole'];
        console.log('Expected role:', expectedRole);

        // Decode the token to extract the user's role
        const userRole = this.getRoleFromToken(this.authService.getToken());
        console.log('User role:', userRole);
        console.log("*** token :", this.authService.getToken());

        // Check if the user's role matches the expected role
        if (userRole === expectedRole) {
            console.log('Access granted');
            return true;
        } else {
            console.log('Access denied');
            this.handleForbiddenAccess(userRole!);
            return false;
        }
    } else {
        // User is not logged in, redirect them to the login page
        console.log('User not logged in, redirecting to login');
        this.router.navigate(['/login']);
        return false;
    }
  }

  // Helper function to decode the JWT token and extract the user's role
  private getRoleFromToken(token: string | null): string | null {
    if (!token) {
        return null;
    }

    try {
        // Decode the token using jwt-decode and extract the role
        const decodedToken: any = jwtDecode(token);
        return decodedToken.role || null;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
  }

  // Handle access denial based on the user's role
  private handleForbiddenAccess(userRole: string): void {
    if (userRole === 'admin') {
        // Redirect to the admin dashboard
        this.router.navigate(['/admin/companies']);
    } else if (userRole === 'client') {
        // Redirect to the client profile
        this.router.navigate(['/offers']);
    } else {
        // Default redirection (home page)
        this.router.navigate(['/login']);
    }
  }
}
