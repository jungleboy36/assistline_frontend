// jwt.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  // URLs that should be excluded from having JWT included
  private excludedUrls: string[] = ['/login','https://nominatim.openstreetmap.org/']; // Add more URLs as needed

  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Check if the request URL matches any of the excluded URLs
    const isExcluded = this.excludedUrls.some(url => request.url.includes(url));
    console.log('Intercepting:', request.url, '| Excluded:', isExcluded);

    if (isExcluded) {
      return next.handle(request);
    }
    const modifiedRequest = request.clone({
      withCredentials: true
    });

    // Pass the modified request to the next handler and handle errors
    return next.handle(modifiedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Session token expired
          Swal.fire({
            icon: 'error',
            title: 'Session expirée',
            text: 'Votre session a expiré. Veuillez vous connecter à nouveau.',
            showConfirmButton: true,
            confirmButtonText: 'OK'
          }).then((result) => {
            if (result.isConfirmed) {
              this.authService.logout();
              this.router.navigate(['/login']); // Redirect to login page
            }
          });
        }
        return throwError(error);
      })
    );
  }
}
