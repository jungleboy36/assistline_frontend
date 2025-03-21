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
  formData: any = {};
  loading: boolean = false;
  emailExists: boolean = false;
  constructor(private registerService: AuthService, private router: Router) { }

  // Handle file input change

  onFileChange(event: Event): void {
      const input = event.target as HTMLInputElement;
      const file = input.files && input.files[0];
  
      if (file) {
          const maxSize = 5 * 1024 * 1024; // 5MB limit
  
          // Validate file type
          if (file.type !== "application/pdf") {
              Swal.fire({
                  icon: "error",
                  title: "Format invalide",
                  text: "Seuls les fichiers PDF sont autorisés.",
                  confirmButtonText: "OK"
              });
              input.value = ""; // Reset input field
              return;
          }
  
          // Validate file size
          if (file.size > maxSize) {
              Swal.fire({
                  icon: "error",
                  title: "Fichier trop volumineux",
                  text: "La taille du fichier dépasse la limite de 5 Mo.",
                  confirmButtonText: "OK"
              });
              input.value = ""; // Reset input field
              return;
          }
  
          // Create a FileReader to convert the file to Base64
          const reader = new FileReader();
          reader.onload = () => {
              this.formData.file = reader.result as string;
          };
  
          // Read the file as a Data URL (Base64 format)
          reader.readAsDataURL(file);
      }
  }
  

  submitForm(): void {
    this.loading = true;
    if (!this.formData.name || !this.formData.email || !this.formData.password || !this.formData.password2 ) {
      Swal.fire({
        icon: 'error',
        title: 'Champs Vides',
        text: 'Veuillez remplir tous les champs obligatoires.',
        confirmButtonText: 'OK'
      });
      this.loading = false;
      return;
    }

    if ( !this.formData.file) {
      this.loading = false;

      Swal.fire({
        icon: 'error',
        title: 'Fichier manquant',
        text: 'Veuillez télécharger un fichier.',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (this.formData.password !== this.formData.password2) {
      this.loading = false;

      Swal.fire({
        icon: 'error',
        title: 'Mot de passe incorrect',
        text: 'Les mots de passe ne correspondent pas.',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Ensure the Base64 encoded file content is included in the form data
    const formData = new FormData();
    formData.append('name', this.formData.name);
    formData.append('email', this.formData.email);
    formData.append('password', this.formData.password);
    formData.append('password2', this.formData.password2);
    formData.append('image','');
    formData.append('file', this.formData.file);
   
    // Call the register service
    this.registerService.register(formData).subscribe(
      
      response => {
        this.loading = true;
/* 
        Swal.fire({
          icon: 'success',
          title: 'Inscription réussie !',
          text: 'Vous vous êtes inscrit avec succès.',
          confirmButtonText: 'OK'
        }); */
        this.router.navigate(['verify-email'], { queryParams: { email: this.formData.email } });
      },
      error => {
        this.loading = false;
        console.log("error: ",error.error.error);
        if (error.error.error == "The user with the provided email already exists (EMAIL_EXISTS)."){
          Swal.fire({
            icon: 'error',
            title: 'Échec de l\'inscription',
            text: 'Un utilisateur avec cet email existe déjà.',
            confirmButtonText: 'OK'
          });
        }
        else{
        Swal.fire({
          icon: 'error',
          title: 'Échec de l\'inscription',
          text: 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer plus tard.',
          confirmButtonText: 'OK'
        });}
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
