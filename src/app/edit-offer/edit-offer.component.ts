import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OfferService } from '../services/offer.service';
import { DatePipe, formatDate } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.component.html',
  styleUrls: []
})
export class EditOfferComponent {
  currentDate!: any;
  minDate: string;
  constructor(private route: ActivatedRoute, public router : Router ,private offerService: OfferService,private datePipe: DatePipe) 
  { 
    this.minDate = this.offerService.getMinDate();
  }
  offer! : any ;
  ngOnInit(): void {

    this.currentDate = this.datePipe.transform(new Date(),'yyyy-MM-ddTHH:mm');
    console.log("current date : ", this.currentDate);
    const offerId = this.route.snapshot.paramMap.get('id');
    this.offerService.getOfferById(offerId!).subscribe(
      (offer) => {
        this.offer = offer;
        this.offer.depart_date_formatted = this.datePipe.transform(this.offer.depart_date!, 'yyyy-MM-ddTHH:mm');
        this.offer.arrival_date_formatted = formatDate(this.offer.arrival_date, 'yyyy-MM-ddTHH:mm', 'en-US');
        console.log("Arrival : ", this.offer.depart_date_formatted);
        console.log("Depart : ", this.offer.arrival_date_formatted);
      },
      (error) => {
        console.error('Error fetching offer:', error);
      }
    );

  }

  updateOffer() {
    const offerId = this.route.snapshot.paramMap.get('id');
    this.offerService.updateOffer(offerId!, this.offer).subscribe(
      (response) => {
        console.log('Offer updated successfully:', response);
        // Show success message using SweetAlert
        Swal.fire({
          icon: 'success',
          title: 'Offer Updated Successfully!',
          timer: 800, // Adjust the timer as needed
          showConfirmButton: false
        }).then(() => {
          // Navigate to the offers page after the alert is closed
          this.router.navigate(['/offers']);
        });
      },
      (error) => {
        console.error('Error updating offer:', error);
        // Show error message using SweetAlert
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update offer. Please try again later.'
        });
      }
    );
  }
  

  goBack(): void{
    this.router.navigate(['/offers']);
  }


}
