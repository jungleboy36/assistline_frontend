import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  formData: any = {
    role: 'particulier', // 'client' = Particulier, 'company' = Professionnel
    civility: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    password2: '',
    raison_sociale: '',
    siret: '',
    contact_name: '',
    file: null,
    acceptTerms: false
  };
  phonePattern = '^(0|\\+33)[1-9][0-9]{8}$';

  loading: boolean = false;
  emailExists: boolean = false;
  constructor(private registerService: AuthService, private router: Router) { }

  // Handle file input change

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
  
    if (file) {
      const maxSize = 5 * 1024 * 1024;
  
      if (file.type !== "application/pdf") {
        Swal.fire({
          icon: "error",
          title: "Format invalide",
          text: "Seuls les fichiers PDF sont autorisés.",
          confirmButtonText: "OK"
        });
        input.value = "";
        return;
      }
  
      if (file.size > maxSize) {
        Swal.fire({
          icon: "error",
          title: "Fichier trop volumineux",
          text: "La taille du fichier dépasse la limite de 5 Mo.",
          confirmButtonText: "OK"
        });
        input.value = "";
        return;
      }
  
      // ✅ Store the real file object
      this.formData.file = file;
    }
  }
  
  
  submitForm(): void {

    this.loading = true;
  
    // Basic empty field validation
    if (!this.formData.email || !this.formData.password || !this.formData.password2) {
      Swal.fire({
        icon: 'error',
        title: 'Champs obligatoires',
        text: 'Veuillez remplir les champs requis.',
        confirmButtonText: 'OK'
      });
      this.loading = false;
      return;
    }
  
    if (this.formData.password !== this.formData.password2) {
      Swal.fire({
        icon: 'error',
        title: 'Mot de passe incorrect',
        text: 'Les mots de passe ne correspondent pas.',
        confirmButtonText: 'OK'
      });
      this.loading = false;
      return;
    }
  
    if (this.formData.role === 'professionnel' && !this.formData.file) {
      Swal.fire({
        icon: 'error',
        title: 'Fichier requis',
        text: 'Veuillez télécharger votre KBIS.',
        confirmButtonText: 'OK'
      });
      this.loading = false;
      return;
    }
  
    // Create the form data to send
    const formData = new FormData();
    formData.append('email', this.formData.email);
    formData.append('password', this.formData.password);
    formData.append('role', this.formData.role );
    formData.append('phone', this.formData.phone || '');
  
    // Particulier fields
    if (this.formData.role === 'particulier') {
      formData.append('civility', this.formData.civility || '');
      formData.append('first_name', this.formData.firstName || '');
      formData.append('last_name', this.formData.lastName || '');
    }
  
    // Professionnel fields
    if (this.formData.role === 'professionnel') {
      formData.append('raison_sociale', this.formData.raison_sociale || '');
      formData.append('siret', this.formData.siret || '');
      formData.append('contact_name', this.formData.contact_name || '');
      if (this.formData.file) {
        formData.append('file', this.formData.file);
      }
    }
  
    // Submit the registration
    this.registerService.register(formData).subscribe(
      response => {
        this.loading = false;
        this.router.navigate(['verify-email'], { queryParams: { email: this.formData.email } });
      },
      error => {
        this.loading = false;
        const errorMessage = error?.error?.error || 'Une erreur est survenue. Veuillez réessayer plus tard.';
        Swal.fire({
          icon: 'error',
          title: 'Échec de l\'inscription',
          text: errorMessage.includes('exists') ? 'Un utilisateur avec cet email existe déjà.' : errorMessage,
          confirmButtonText: 'OK'
        });
      }
    );
  }
  

  // Validate email format
  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email);
  }

  checkEmail(): void {
    this.registerService.checkEmail(this.formData.email).subscribe(
      response => {
        this.emailExists = response.exists;
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
}
