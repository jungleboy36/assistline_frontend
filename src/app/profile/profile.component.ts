import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { DomSanitizer } from '@angular/platform-browser'; // Import DomSanitizer for safe HTML
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: []
})
export class ProfileComponent implements OnInit {
  userProfile: any;
  uid!: string | null;
  profileForm!: FormGroup;
  profileImageBase64: string | null = null; // Store Base64 image
  maxImageSizeKB = 850; // Maximum allowed Base64 image size in KB
  loading: boolean = false;
  userProfileLoading : boolean = false;
  feedbacks : any[] =[];
  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    // Inject DomSanitizer
  ) {}

  ngOnInit() {

    // Fetch the logged-in user ID from the AuthService
    this.uid = this.authService.getUserId();
    // Initialize the profile form
    this.initForm();
    this.loadFeedbacks();
    // Fetch the user profile data
    this.profileService.getUserProfile(this.uid!).subscribe(
      data => {
        this.userProfile = data;
        // Populate the form with user data
        this.profileForm.patchValue(this.userProfile);
      }
      ,
      
      error => {
        console.error('Error fetching user profile', error);
      }
    );
    
  }

  // Initialize the form
  initForm() {
    this.profileForm = this.fb.group({
      name: [this.userProfile?.name || '', Validators.required],
      bio: [this.userProfile?.bio || ''],
      phone: [this.userProfile?.phone || ''],
      city: [this.userProfile?.city || ''],
      email: [{ value: this.userProfile?.email || '', disabled: true }], // Email is read-only
      image: [null],
      hideEmail :[this.userProfile?.hideEmail || true],
      paypalEmail : [this.userProfile?.paypalEmail ||  ''],
      // Use a file input for the image
    });
  }

  // Method to handle profile image file input change
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Create a FileReader
      const reader = new FileReader();

      reader.onload = () => {
        // Assign the Base64 string to the profileImageBase64 variable
        this.profileImageBase64 = reader.result as string;

        // Calculate the size of the Base64 image in kilobytes
        const base64Length = this.profileImageBase64.length;
        const imageSizeKB = (base64Length * 3 / 4) / 1024;

        // Check if the image size exceeds the maximum limit
        if (imageSizeKB > this.maxImageSizeKB) {
          Swal.fire({
            title: 'Image too large',
            text: `The image size exceeds the maximum limit of ${this.maxImageSizeKB} KB. Please choose a smaller image.`,
            icon: 'warning',
            confirmButtonText: 'OK'
          });

          // Clear the image input
          this.profileForm.get('image')?.setValue(null);
          this.profileImageBase64 = null;
        } else {
          // Update the profile form with the Base64 encoded image
          this.profileForm.get('image')?.setValue(this.profileImageBase64);
        }
        console.log("image input value: ", this.profileForm.get('image')?.value);
      };

      // Read the file as a Data URL (Base64 format)
      reader.readAsDataURL(file);
    }
  }

  // Method to handle profile form submission
  onSubmitProfileForm() {
    this.loading = true;
   
        // Get the form data
      
        if (this.profileForm.valid) {
          // Get the form data
          const updatedData = { ...this.profileForm.value };
      
          // Check if the image has changed
          if (updatedData.image === this.userProfile.image) {
            // Image hasn't changed, remove it from the payload
            delete updatedData.image;
          }

          if(updatedData.paypalEmail != '' && ! this.isEmailValid(updatedData.paypalEmail)){
            this.loading = false;
            Swal.fire({
              title: 'Erreur!',
              text: "l'email paypal doit être valide",
              icon: 'error',
              confirmButtonText: 'OK'
          })
          return;
          }
     
        // Update the user profile data
        this.profileService.updateUserProfile(this.uid!, updatedData).subscribe(
            () => {
                // Profile updated successfully
                this.loading = false;
                Swal.fire({
                    title: 'Success!',
                    text: 'Profile updated successfully',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    // Reset the profile image preview
                    this.profileImageBase64 = null;

                    // Reload the data after the alert is closed
                    this.loadProfileData();
                });
            },
            error => {
                this.loading = false;

                // Error updating user profile
                console.error('Error updating user profile', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Error updating profile',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        );
    } else {
        this.loading = false;

        console.error('Form is not valid');
        Swal.fire({
            title: 'Invalid form',
            text: 'Please correct the errors in the form',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    }
}


  // Method to reload profile data
  loadProfileData() {
    this.profileService.getUserProfile(this.uid!).subscribe(
      data => {
        this.userProfile = data;
        // Populate the form with the updated user data
        this.profileForm.patchValue(this.userProfile);

      },
      error => {
        console.error('Error fetching user profile', error);
      }
    );
  }
  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email);
  }

  loadFeedbacks(){
    this.profileService.retrieve_feedbacks(this.uid!).subscribe((feedbacks)=>{
      this.feedbacks = feedbacks;
      
      console.log("feedbacks: ", this.feedbacks);
    })
  }

  getStarsArray(stars: string): number[] {
    return Array(parseInt(stars, 10));
  }

  getEmptyStarsArray(stars: string): number[] {
    return Array(5 - parseInt(stars, 10));
  }


reportFeedback(id : string){
  if (window.confirm('Voulez-vous signaler cet avis ?')) {
    this.profileService.report_feedback(id).subscribe((response)=>{
      console.log("feedback reported: ", response);
      Swal.fire({
        
        text: 'Avis signalé !',
        icon: 'success',
        confirmButtonText: 'OK'
    });
      this.loadFeedbacks();
    })
    
  }
}
}

