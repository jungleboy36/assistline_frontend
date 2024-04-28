  import { Injectable } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Observable, BehaviorSubject, of } from 'rxjs';
  import { catchError, map, tap } from 'rxjs/operators';
  import { Router } from '@angular/router';
  import { jwtDecode } from 'jwt-decode';
  import { AuthGuard } from './AuthGuard';
  import { AngularFireAuth } from '@angular/fire/compat/auth';
import Swal from 'sweetalert2';

  @Injectable({
    providedIn: 'root'
  })
  export class AuthService {
    private apiUrl = 'http://localhost:8000/';

    // Observable to track the logged-in state of the user
    private isLoggedInSubject = new BehaviorSubject<boolean>(false);
    public isLoggedIn$ = this.isLoggedInSubject.asObservable();
    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();
      // Property to store the user's information
    public infoUser : any = null;
    public role : string ='' ;
    public token: string | null = null;
    errorMessage: any;
    constructor(private http: HttpClient, private router: Router,private auth: AngularFireAuth,) {
      // Load user info from local storage when the service is instantiated
      this.loadUserInfo();
      //
      
    }
    // Register a new user
    register(formData: FormData): Observable<any> {
      return this.http.post<any>(this.apiUrl + 'register/', formData);
    }

    // Login a user and store their information
    login(email: string, password: string): void {
      this.loadingSubject.next(true); // Set loading to true when login process starts
      this.auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          console.log("user credentials : ", user);
          // Check if email is verified and account is enabled
          console.log("user id: ", user!.uid);
          this.checkUserStatus(user!.uid).subscribe(enabled => {
            if (user && user.emailVerified && enabled) {
              // Proceed with normal login flow
              console.log('Login successful');
              const userId = user.uid;
              // Set the user ID in local storage
              localStorage.setItem('userId', userId);
              localStorage.setItem('display_name', user.displayName!);
              localStorage.setItem('email', user.email!);
              this.isLoggedInSubject.next(true);
              user.getIdToken().then(id_token => {
                localStorage.setItem('id_token', id_token);
              });
              this.getRoleByEmail(email).subscribe(data => {
                console.log('data :', data);
                this.role = data['role'];
                console.log('role ! : ', this.role);
                localStorage.setItem('role', this.role);
                if (this.role === 'admin') {
                  this.router.navigate(['/admin/clients']);
                } else if (this.role === 'client') {
                  this.router.navigate(['/offers']);
                } else {
                  // Default redirect for unrecognized roles
                  this.router.navigate(['/offers']);
                }
              });
            } else {
              // Account is disabled or email is not verified
              this.loadingSubject.next(false); // Set loading to false after login attempt
              let errorMessage = 'Incorrect email or password. Please try again.';
              if (user && !user.emailVerified) {
                errorMessage = 'Email not verified. Please verify your email address.';
              } else if (!enabled) {
                errorMessage = 'Your account is disabled. Please contact support for assistance.';
              }
              Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: errorMessage,
                confirmButtonText: 'OK'
              });
            }
          });
        })
        .catch(error => {
          // Login failed
          console.error('Login failed', error);
          this.loadingSubject.next(false); 
          Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: 'Incorrect email or password. Please try again.',
            confirmButtonText: 'OK'
          });
        })
        .finally(() => {
          // Set loading to false after login attempt
          this.loadingSubject.next(false);
        });
    }
    

    // Logout a user and clear their information
    logout(): void {

      this.auth.signOut().then(() => {
      localStorage.clear();
      this.router.navigate(['/login']) 
      this.isLoggedInSubject.next(false);
      });
    }

    // Save user information to local storage
  

    // Load user information from local storage
    private loadUserInfo(): void {
      const storedToken = localStorage.getItem('id_token');

      if (storedToken) {
        this.token = storedToken;
        this.isLoggedInSubject.next(true);
      } else {
        this.isLoggedInSubject.next(false);
      }
    }



  /*   updateUsername(newUsername: string): void {
      if (this.userInfo) {
          // Update the username in the userInfo object
          this.userInfo.display_name = newUsername;
          
          // Save the updated userInfo back to local storage
        
      }
    } */

  getUserId() : string {
    return localStorage.getItem('userId')!;
  }


  public getInfoFromToken(): any | null {


  this.infoUser = {};
          
    try {
        // Decode the token using jwt-decode

        this.infoUser.uid = localStorage.getItem('userId')
        this.infoUser.display_name = localStorage.getItem('display_name');
        this.infoUser.email = localStorage.getItem('email')

        return this.infoUser;
    } catch (error) {
        console.error('Error loading info:', error);
        return null;
    }
  }



  getToken() : string | null {
    return localStorage.getItem('id_token');
  }


  getRoleFromToken(token: string | null): Observable<string> {
    if (!token) {
      return of(''); // Return an empty string if the token is null
    }
    // Fetch the user's role from Firestore
    return this.http.get<any>(`${this.apiUrl}get-role/${token}`).pipe(
      map(response => response.role || '') // Extract the role from the response or return an empty string if not found
    );
  }


  isLoggedIn(): boolean {
    return this.isLoggedInSubject.getValue();
  }

  getRoleByEmail(token: string | null): Observable<any> {
    // Check if the token is null
    if (!token) {
      return of({ error: 'Token is null' }); // Return an observable with an error object
    }

    // Fetch the user's role from Firestore
    return this.http.get<any>(`${this.apiUrl}/get-role/${token}`).pipe(
      catchError(error => {
        console.error('Error fetching role:', error);
        return of({ error: 'Failed to fetch role' }); // Return an observable with an error object
      })
    );
  }

  getRole() : string{
    return localStorage.getItem('role')!;
  }

  checkUserStatus(userId: string): Observable<boolean> {
    // Make a request to the backend API to check user status
    return this.checkUser(userId).pipe(
      map(response => {
        const enabled = response.enabled;
        if (enabled) {
          // User is enabled, proceed with normal login flow
          console.log('User is enabled');
          return true;
        } else {
          // User is disabled, show a message or take appropriate action
          console.log('User is disabled');
          return false;
        }
      }),
      catchError(error => {
        console.error('Error checking user status', error);
        return of(false); // Handle error response from the backend API
      })
    );
  }
  

  checkUser(userId: string): Observable<any> {
    const url = `${this.apiUrl}status/${userId}`;
    return this.http.get<any>(url);
  }
  }