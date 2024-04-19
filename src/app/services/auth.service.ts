import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/';

  // Observable to track the logged-in state of the user
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  // Property to store the user's information
  public infoUser : any = null;

  public token: string | null = null;

  constructor(private http: HttpClient, private router: Router) {
    // Load user info from local storage when the service is instantiated
    this.loadUserInfo();
  }

  // Register a new user
  register(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'register/', formData);
  }

  // Login a user and store their information
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'login/', { email, password }).pipe(
      tap(response => {
        if (response.message === 'Login successful') {
          // Store the token in local storage
          this.token = response.token;
          localStorage.setItem('token', this.token!);

          // Update the logged-in state
          this.isLoggedInSubject.next(true);

          // Load user info if available
        
        }
      })
    );
  }

  // Logout a user and clear their information
  logout(): void {
    this.token = null;
    this.isLoggedInSubject.next(false);
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  // Save user information to local storage
 

  // Load user information from local storage
  private loadUserInfo(): void {
    const storedToken = localStorage.getItem('token');

    if (storedToken) {
      this.token = storedToken;
      this.isLoggedInSubject.next(true);
    } else {
      this.isLoggedInSubject.next(false);
    }
  }

  isLoggedIn(): boolean {
    // Check if there is a token in local storage
    const storedToken = localStorage.getItem('token');
    return storedToken !== null;
  }



/*   updateUsername(newUsername: string): void {
    if (this.userInfo) {
        // Update the username in the userInfo object
        this.userInfo.display_name = newUsername;
        
        // Save the updated userInfo back to local storage
       
    }
  } */

  private getInfoFromToken(token: string | null): string[] | null {
    if (!token) {
        return null;
    }

    try {
        // Decode the token using jwt-decode and extract the role
        const decodedToken: any = jwtDecode(token);
        this.infoUser.id = decodedToken.uid;
        this.infoUser.display_name = decodedToken.display_name;
        this.infoUser.email = decodedToken.email;
        return this.infoUser;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
  }




getToken() : string | null {
  return localStorage.getItem('token');
}
}