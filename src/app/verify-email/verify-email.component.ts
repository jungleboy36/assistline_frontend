import { query } from '@angular/animations';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import sweetAlert from 'sweetalert2';
@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent {
  otp: string[] = ['', '', '', '', '', ''];
  errorMessage: string = '';
  loading: boolean = false;
  email:string='';
  canResend: boolean = false;
  codeSent: boolean = false;
  codeSending: boolean = false;
  constructor( private route: ActivatedRoute, private authService: AuthService,private router: Router) {

    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';  // Retrieve the email
      console.log("Received Email:", this.email);
    });
    this.authService.canResend(this.email).subscribe(response => {
      this.canResend = response.resend;
    }, error => {
      if(error.error.error=="already verified"){
      this.router.navigate(['/login']);  
      }
    }
    );
  }
moveToNext(event: Event, index: number) {
  const input = event.target as HTMLInputElement;
  
  // Move to next input field if digit is entered
  if (input.value.length === 1 && index < 6) {
    const nextInput = document.querySelectorAll('.otp-input')[index] as HTMLInputElement;
    if (nextInput) nextInput.focus();
  }

  // Auto-submit when all 6 digits are entered
  if (this.otp.every(digit => digit !== '')) {
    this.verifyOtp();
  }}

  verifyOtp() {
    const enteredOtp = this.otp.join('');
    console.log('Verifying OTP:', enteredOtp);
    $('.otp-input').attr('disabled', 'disabled');
   this.loading = true;
    this.authService.verifyOtp( enteredOtp,this.email)
        .subscribe(
            () => {
                console.log('Email verified successfully!');
                this.errorMessage = '';
                this.loading = false;
                sweetAlert.fire({
                  title: 'Email vérifié',
                  text: 'Votre email a été vérifié avec succès !',
                  icon: 'success',
                  confirmButtonText: 'OK'
              }).then(() => {
                  window.location.href = '/login';
              });
            },
            error => {
              console.log(error);
             
              if(error.error.message=="expired"){
                this.errorMessage = 'Le code a expiré. Veuillez en demander un nouveau.';
              this.canResend = true;}
              if(error.error.message=="invalid"){
                this.errorMessage = 'Code invalide. Veuillez réessayer.';
              }
                console.error('Error verifying email:', error);
            const otpContainer = document.querySelector(".otp-container");
            otpContainer?.classList.add("shake");
            // Remove shake effect after animation completes
            setTimeout(() => {
                otpContainer?.classList.remove("shake");
            }, 400);

            this.loading = false;
            $('.otp-input').attr('disabled', null);
            $('.otp-input').val('');
            this.otp = ['', '', '', '', '', ''];

                      }
        );






  }

  resendOtp() {
    this.codeSending = true;
    this.authService.resendOtp(this.email).subscribe(response => {
      this.codeSending = false;
      this.codeSent = true;
      console.log(response);
      this.loading = false;
      this.canResend = false; // Reset resend button
    }, error => {
      console.error(error);
      alert("Erreur lors de l'envoi du nouveau OTP.");
      this.loading = false;
    });
  }
  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text')?.trim() || '';
    if (pasted.length === this.otp.length && /^\d+$/.test(pasted)) {
      for (let i = 0; i < this.otp.length; i++) {
        this.otp[i] = pasted.charAt(i);
      }
      // update view and then verify
      setTimeout(() => this.verifyOtp(), 0);
    }
  }
  
  
}