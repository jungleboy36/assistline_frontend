import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  errorMessage: string = '';
  verifyErrorMessage: string = '';  
  loginForm: FormGroup;
  loading: boolean = false;
  private loadingSubscription: Subscription;
    constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    this.loadingSubscription = this.authService.loading$.subscribe(loading => {
      this.loading = loading;
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe from loading subscription to prevent memory leaks
    this.loadingSubscription.unsubscribe();
  }
  onSubmit(): void {
    if (this.loginForm.valid && !this.loading) {
      this.loading = true;
      const { email, password } = this.loginForm.value;
  
      this.authService.login(email, password).subscribe(
        async () => {
          // ✅ Session-based login successful
          try {
            const session = await this.authService.checkSession().toPromise();
            this.loading = false;
  
            console.log('Session:', session);
  
            if (!session.verified) {
              this.router.navigate(['/verify-email'], { queryParams: { email: session.email } });
              return;
            }
  
            if (!session.enabled) {
              this.verifyErrorMessage = "Votre compte est encore en cours de vérification, veuillez réessayer plus tard";
              return;
            }
  
            if (session.role === 'admin') {
              this.router.navigate(['/admin/companies']);
            } else if (session.role === 'professionnel' || session.role === 'particulier') {
              this.router.navigate(['/offers']);
            }
  
          } catch (sessionError) {
            console.error("Session check failed after login", sessionError);
            this.errorMessage = "Échec de récupération de session après connexion.";
          }
        },
        (err) => {
          this.loading = false;
          this.errorMessage = err.error?.error || "Une erreur est survenue.";
          console.error(err);
  
          // Shake animation
          setTimeout(() => $('.alert').addClass('shake'), 100);
          setTimeout(() => $('.alert').removeClass('shake'), 2000);
        }
      );
    }
  }
  
}
