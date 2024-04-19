import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: []
})
export class LoginComponent {
  loginForm: FormGroup;
  loading: boolean = false;
  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    this.loading = true;
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe(
        response => {
          Swal.fire({
            icon: 'success',
            title: 'Login Successful!',
            text: 'You have successfully logged in.',
            confirmButtonText: 'OK'
          });
          // Navigate to the desired page after successful login
          if(response['role'] === 'admin'){
          this.router.navigate(['/admin/companies']);}
          else{
            this.router.navigate(['/offers'])}
        },
        error => {
          // Handle failed login
          const errorMessage = error?.error?.message;
          if (error.status === 403 && error.error && error.error.error === 'Account disabled') {
            this.loading = false; 
              Swal.fire({
                  icon: 'error',
                  title: 'Connexion échouée',
                  text: 'Votre compte a été désactivé.',
                  confirmButtonText: 'OK'
              });
          } else {
            this.loading = false; 
              Swal.fire({
                  icon: 'error',
                  title: 'Connexion échouée',
                  text: 'Une erreur est survenue lors de la connexion. Veuillez réessayer plus tard.',
                  confirmButtonText: 'OK'
              });
          }
      }
      );
    }
  }
}
