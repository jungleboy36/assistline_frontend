import { AfterViewInit, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OfferService } from '../services/offer.service';
import { DatePipe, formatDate } from '@angular/common';
import * as $ from 'jquery';
import Swal from 'sweetalert2';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import * as LCG from 'leaflet-control-geocoder';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.component.html',
  styleUrls: ['./edit-offer.component.html']
})
export class EditOfferComponent implements AfterViewInit{
  currentDate!: any;
  minDate: string;
  isAdding: boolean = false;
  map: any;
  offerMap : any;
  itinerary: string = '';
  originPin: L.Marker | undefined;
  destinationPin: L.Marker | undefined;
  routeControl: L.Routing.Control | undefined;
  routeLayer: any;
  nb : number = 0;
  offerForm ;
  mapResetted: boolean = false;
  constructor(private route: ActivatedRoute, public router : Router ,private offerService: OfferService,private datePipe: DatePipe, private formBuilder : FormBuilder) 
  { 
    this.minDate = this.offerService.getMinDate();
    this.offerForm = this.formBuilder.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      depart_date: ['', Validators.required],
      arrival_date: ['', Validators.required],
      origin: ['', Validators.required],
      destination: ['', Validators.required]
      // Add other form controls here
  });
  }
  offer! : any ;
  ngOnInit(): void {
    const offerId = this.route.snapshot.paramMap.get('id');
    console.log("edit offer id : ",offerId);
    this.offerService.getOfferById(offerId!).subscribe(
      (offer) => {
        this.offer = offer;
        this.offer.depart_date = JSON.parse(this.offer.depart_date);
        this.offer.arrival_date = JSON.parse(this.offer.arrival_date);

      },
      (error) => {
        console.error('Error fetching offer details:', error);
      }
    );
    const geocoder = LCG.geocoder({
      defaultMarkGeocode: false,
      geocoder: new (L.Control as any).Geocoder.Nominatim({
        geocodingQueryParams: {
          countrycodes: 'fr',  },
      }),
    });
    const originInput = document.getElementById('origin') as HTMLInputElement;
    const destinationInput = document.getElementById('destination') as HTMLInputElement;
    const originSuggestions = document.getElementById('origin-suggestions') as HTMLUListElement;
    const destinationSuggestions = document.getElementById('destination-suggestions') as HTMLUListElement;

    const showSuggestions = (query: string, suggestionsElement: HTMLUListElement, inputElement: HTMLInputElement) => {
      geocoder.options.geocoder!.geocode(query, (results) => {
        suggestionsElement.innerHTML = '';
        results.forEach(result => {
          const suggestionItem = document.createElement('li');
          suggestionItem.classList.add('list-group-item');
          suggestionItem.textContent = result.name;
          suggestionItem.addEventListener('click', () => {
            inputElement.value = result.name;
            suggestionsElement.innerHTML = '';
            if (inputElement.id === 'origin') {
              if (this.originPin) {
                this.map.removeLayer(this.originPin);    
              }
              this.originPin = L.marker(result.center,{draggable : true}).addTo(this.map);

              this.originPin.on('dragend', () => {
                this.reverseGeocode(this.originPin!.getLatLng(), originInput);
                this.updateRoute();
              });
              console.log('originPin: ',this.originPin);
              this.map.setView(result.center, this.map.getZoom());
            } else if (inputElement.id === 'destination') {
              if (this.destinationPin) {
      
                this.map.removeLayer(this.destinationPin);

              }
              this.destinationPin = L.marker(result.center ,{draggable : true}).addTo(this.map);
              this.destinationPin.on('dragend', () => {
                this.reverseGeocode(this.destinationPin!.getLatLng(), destinationInput);
                this.updateRoute();
              });
              this.map.setView(result.center, this.map.getZoom());
              
            }
            this.updateRoute();
          });
          suggestionsElement.appendChild(suggestionItem);
        });
      });
    };

    originInput.addEventListener('keyup', (event) => {
  
      const query = (event.target as HTMLInputElement).value;
      if (query.length > 2) {
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
    
 

    this.currentDate = this.datePipe.transform(new Date(),'yyyy-MM-ddTHH:mm');
    console.log("current date : ", this.currentDate);
    

  }

  ngAfterViewInit(): void {
    this.map = L.map('map').setView([48.8566, 2.3522], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    this.routeLayer = L.layerGroup().addTo(this.map);

    console.log('originPin: ',this.originPin);
    console.log("destinationPin: ",this.destinationPin);  
    const originLatLng = JSON.parse(this.offer.originMap);
    const destinationLatLng = JSON.parse(this.offer.destinationMap);

    // Re-add the existing markers to the map
    L.marker(originLatLng, {draggable : false}).addTo(this.map);
    L.marker(destinationLatLng, {draggable : false}).addTo(this.map);
    const bounds = new L.LatLngBounds(originLatLng, destinationLatLng);
    let coordinates;
    try {
      coordinates = JSON.parse(this.offer.route).coordinates.map((coord: any) => L.latLng(coord.lat, coord.lng));
    } catch (error) {
      console.error('Error parsing route coordinates:', error);
      return;
    }
    L.polyline(coordinates, { color: 'blue', weight: 4 }).addTo(this.map);
    this.map.fitBounds(bounds, { padding: [20, 20] });
  }
  updateOffer() {
    this.isAdding = true;
    this.offer.depart_date = JSON.stringify(this.offer.depart_date)
    this.offer.arrival_date = JSON.stringify(this.offer.arrival_date)
    const offerId = this.route.snapshot.paramMap.get('id');
    this.offer.originMap = JSON.stringify(this.originPin?.getLatLng());
    this.offer.destinationMap = JSON.stringify(this.destinationPin?.getLatLng());
  
    this.offerService.updateOffer(offerId!, this.offer).subscribe(
      (response) => {
        console.log('Offer updated successfully:', response);
        this.isAdding = false;
        // Show success message using SweetAlert
        Swal.fire({
          icon: 'success',
          title: 'Offre mise à jour avec succès !',
          timer: 800, // Adjust the timer as needed
          showConfirmButton: false
        }).then(() => {
          // Navigate to the offers page after the alert is closed
          this.router.navigate(['/offers']);
        });
      },
      (error) => {
        this.isAdding = false;
        console.error('Error updating offer:', error);
        // Show error message using SweetAlert
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "La mise à jour de l'offre a échoué. Veuillez réessayer plus tard."
        });
      }
    );
  }
  
  updateRoute(): void {
    if (this.originPin && this.destinationPin) {
      const originLatLng = this.originPin.getLatLng();
      const destinationLatLng = this.destinationPin.getLatLng();
      
      // Ensure the coordinates are within the valid range
      if (this.isValidCoordinate(originLatLng) && this.isValidCoordinate(destinationLatLng)) {
        if (this.routeControl) {
          this.map.removeControl(this.routeControl);
        }
  
        // Remove the existing markers from the map to avoid duplication
        this.map.removeLayer(this.originPin);
        this.map.removeLayer(this.destinationPin);
  
        this.routeControl = L.Routing.control({
          waypoints: [
            originLatLng,
            destinationLatLng,
          ],
          routeWhileDragging: true,
          router: new L.Routing.OSRMv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
          })
        }).on('routingerror', function (e) {
          console.error('Routing error: ', e);
          alert('Routing error: ' + e.message);
        }).on('routesfound', (e) => {
          const routes = e.routes;
          const route = routes[0]; // Assuming we take the first route
          this.offer.route = JSON.stringify(route) ;
          console.log("route: ", route);
          // Save the route data
         
        }).addTo(this.map);
          $('.leaflet-routing-alternatives-container').remove();

        // Re-add the existing markers to the map
        this.originPin.addTo(this.map);

        this.destinationPin.addTo(this.map);
        const bounds = new L.LatLngBounds(originLatLng, destinationLatLng);
        this.map.fitBounds(bounds, { padding: [20, 20] });
        $('.leaflet-routing-alternatives-container').remove();

      } else {
        alert("assurez-vous de placer les épingles à l'intérieur de la france");
      }
    }
  }


  isValidCoordinate(latlng: L.LatLng): boolean {
    const lat = latlng.lat;
    const lng = latlng.lng;
    
    // France's approximate geographical bounds
    const minLat = 42.0;
    const maxLat = 51.0;
    const minLng = -5.0;
    const maxLng = 8.0;
    
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  }

  reverseGeocode(latlng: L.LatLng, inputElement: HTMLInputElement) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`;
    const geocoder = LCG.geocoder({
      defaultMarkGeocode: false,
      geocoder: new (L.Control as any).Geocoder.Nominatim({
        geocodingQueryParams: {
          countrycodes: 'fr',  },
      }),
    });
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.address) {
          const address = `${data.address.road || ''}, ${data.address.city || data.address.town || data.address.village || ''}, ${data.address.state || ''}, ${data.address.country || ''}`;
          //inputElement.value = address;
          geocoder.options.geocoder!.geocode(address, (results) => {
            inputElement.value = results[0].name;
            if (inputElement.id === 'origin') {
              this.offerForm.controls['origin'].setValue(results[0].name);
              this.offerForm.controls['origin'].updateValueAndValidity();
              this.offer.origin = results[0].name
            } else if (inputElement.id === 'destination') {
              this.offerForm.controls['destination'].setValue(results[0].name);
              this.offerForm.controls['destination'].updateValueAndValidity();
              this.offer.destination = results[0].name

            }
          });
  
            
        } else {
          inputElement.value = 'Address not found';
        }
      })
      .catch(error => {
        console.error('Error fetching address:', error);
        inputElement.value = 'Error fetching address';
      });
  }

  removeAllPins(): void {
    this.mapResetted = true;
    const originInput = document.getElementById('origin') as HTMLInputElement
  const destinationInput = document.getElementById('destination') as HTMLInputElement
  originInput.value = '';
  destinationInput.value ='';
    this.routeLayer.clearLayers();
    this.originPin = undefined;
    this.destinationPin = undefined;
    this.routeControl = undefined;
  this.map = this.map.remove();
  this.nb= 0;
  this.map = L.map('map').setView([48.8566, 2.3522], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(this.map);
  this.routeLayer = L.layerGroup().addTo(this.map);
  this.map.on('click', (e: any) => {
  
    if (!this.originPin) {
      this.originPin = L.marker(e.latlng,{draggable : true}).addTo(this.routeLayer);
      this.reverseGeocode(this.originPin.getLatLng(),document.getElementById('origin') as HTMLInputElement);
  
    } else if (!this.destinationPin) {
      this.destinationPin = L.marker(e.latlng, {draggable: true}).addTo(this.routeLayer);
      this.reverseGeocode(this.destinationPin.getLatLng(),document.getElementById('destination') as HTMLInputElement);
    }
    // Check if both pins are placed
    if (this.originPin && this.destinationPin && (this.nb ==0)) {
      this.nb = 1;
      this.updateRoute(); 
     
    }
    
    this.originPin!.on('dragend',(e:any)=>{
      console.log("origin pin dragged !");
      this.reverseGeocode(this.originPin!.getLatLng(),originInput);
      this.updateRoute();
    });
    this.destinationPin!.on('dragend',()=>{
      this.reverseGeocode(this.destinationPin!.getLatLng(),destinationInput);
      this.updateRoute();
    });
  });
  
  }

  goBack(): void{
    this.router.navigate(['/offers']);
  }

  mapModal(){
    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);
  }
}
