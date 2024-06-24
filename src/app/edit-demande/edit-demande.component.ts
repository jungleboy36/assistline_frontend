import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DemandeService } from '../services/demande.service';
import Swal from 'sweetalert2';
import { DatePipe } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import * as LCG from 'leaflet-control-geocoder';
@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-demande.component.html',
  styleUrls: []
})
export class EditDemandeComponent {
  minDate: string;
  isAdding : boolean = false;
  constructor(private route: ActivatedRoute, public router : Router ,private demandeService: DemandeService,private datePipe: DatePipe) { 
    this.minDate = this.demandeService.getMinDate();

  }
  demande! : any ;
  ngOnInit(): void {
    const demandeId = this.route.snapshot.paramMap.get('id');
    this.demandeService.getDemandeById(demandeId!).subscribe(
      (demande) => {
        this.demande = demande;
        this.demande.date = JSON.parse(this.demande.date);
      },
      (error) => {
        console.error('Error fetching offer:', error);
      }
    );

    const originInput = document.getElementById('origin') as HTMLInputElement;
    const destinationInput = document.getElementById('destination') as HTMLInputElement;
    const originSuggestions = document.getElementById('origin-suggestions') as HTMLUListElement;
    const destinationSuggestions = document.getElementById('destination-suggestions') as HTMLUListElement;
    console.log("origin input:",originInput);
    const geocoder = LCG.geocoder({
      defaultMarkGeocode: false,
      geocoder: new (L.Control as any).Geocoder.Nominatim({
        geocodingQueryParams: {
          countrycodes: 'fr',  },
      }),
    });
    const showSuggestions = (query: string, suggestionsElement: HTMLUListElement, inputElement: HTMLInputElement) => {
      geocoder.options.geocoder!.geocode(query, (results) => {
        suggestionsElement.innerHTML = '';
        results.forEach(result => {
          console.log("result: ",result);
          const suggestionItem = document.createElement('li');
          suggestionItem.classList.add('list-group-item');
          suggestionItem.textContent = result.name;
          suggestionItem.addEventListener('click', () => {
            inputElement.value = result.name;
            suggestionsElement.innerHTML = '';
            if (inputElement.id === 'origin') {
            this.demande.depart = result.name;
            }
            if (inputElement.id === 'destination') {
              this.demande.destination = result.name;
              }
             
          });
          suggestionsElement.appendChild(suggestionItem);
        
      })}
      )}

    originInput.addEventListener('keyup', (event) => {
      const query = (event.target as HTMLInputElement).value;
      if (query.length > 2) {
        console.log("origin input typing...");

        showSuggestions(query, originSuggestions, originInput);
      } else {
        originSuggestions.innerHTML = '';
      }
    });

    destinationInput.addEventListener('keyup', (event) => {
   
      const query = (event.target as HTMLInputElement).value;
      if (query.length > 2) {
        showSuggestions(query, destinationSuggestions, destinationInput);
      } else {
        destinationSuggestions.innerHTML = '';
      }
    });

  }

  updateDemande() {
    this.isAdding  = true;
    const demandeId = this.route.snapshot.paramMap.get('id');
    this.demande.date = JSON.stringify(this.demande.date);
    this.demandeService.updateDemande(demandeId!, this.demande).subscribe(
      (response) => {
        console.log('Demande updated successfully:', response);
        this.isAdding = false;
        Swal.fire({
          icon: 'success',
          title: 'Demande mise à jour avec succès !',
          timer: 800, // Adjust the timer as needed
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/demandes']);
          
        });
      },
      (error) => {
        console.error('Error updating demande:', error);
        this.isAdding = false;
      }
    );
  }

  goBack(): void{
    this.router.navigate(['/demandes']);
  }
}
