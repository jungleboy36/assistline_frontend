import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DemandeService } from '../services/demande.service';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-demande.component.html',
  styleUrls: []
})
export class EditDemandeComponent {
  minDate: string;
  constructor(private route: ActivatedRoute, public router : Router ,private demandeService: DemandeService) { 
    this.minDate = this.demandeService.getMinDate();

  }
  demande! : any ;
  ngOnInit(): void {
    const demandeId = this.route.snapshot.paramMap.get('id');
    this.demandeService.getDemandeById(demandeId!).subscribe(
      (demande) => {
        this.demande = demande;
      },
      (error) => {
        console.error('Error fetching offer:', error);
      }
    );
  }

  updateDemande() {
    const demandeId = this.route.snapshot.paramMap.get('id');
    this.demandeService.updateDemande(demandeId!, this.demande).subscribe(
      (response) => {
        console.log('Demande updated successfully:', response);
        this.router.navigate(['/demandes']);
      },
      (error) => {
        console.error('Error updating demande:', error);
      }
    );
  }

  goBack(): void{
    this.router.navigate(['/demandes']);
  }
}
