import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, Renderer2 } from '@angular/core';
import { OfferService } from '../services/offer.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { DatePipe, JsonPipe } from '@angular/common';
import { ChatService } from '../services/chat.service';
import * as $ from 'jquery';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import * as LCG from 'leaflet-control-geocoder';
import * as turf from '@turf/turf';
import Pusher from 'pusher-js';

class NoMarkerPlan extends L.Routing.Plan {
  createMarker(i: number, waypoint: L.Routing.Waypoint, n: number): L.Marker | null {
      return null; // Prevent marker creation
  }
}

@Component({
  selector: 'app-offer-list',
  templateUrl: './offer-list.component.html',
  styleUrls: ['./offer-list.component.html'],
})
export class OfferListComponent implements OnInit, AfterViewInit {
  departStartDate: Date | null = null;
  departEndDate: Date | null = null;
  destinationStartDate: Date | null = null;
  destinationEndDate: Date | null = null;
  searchedOffers:any[] = [];
  isAdding: boolean = false;
  departSearch : string ='';
  destinationSearch : string ='';
  filterLoading : boolean= false;
  map: any;
  filterButton : boolean = false;
  selectedDateRange: any ;
  offerMap : any;
  itinerary: string = '';
  originPin: L.Marker | undefined;
  destinationPin: L.Marker | undefined;
  routeControl: L.Routing.Control | undefined;
  routeLayer: any;
  mapLoading : boolean = false;
  allFieldsFilled: boolean = false;
  public offers: any[] = [];
  filteredOffers: any[] = [];
  len!: number;
  errorMessage: string = '';
  showAddOfferModal: boolean = false;
  searchQuery: string = '';
  filterOption: string = 'all';
  newOffer: any = {
    user_id: '',
    title: '',
    description: '',
    depart_date: '',
    arrival_date: '',
    origin:'',
    destination :'',
    originMap : '',
    destinationMap : '',
    route: null,
    picture  : localStorage.getItem('profileImageUrl')
  };

  offerForm!: FormGroup;
  @ViewChild('cancelButton') cancelButton: ElementRef | undefined;
  @ViewChild('addOfferModal') addOfferModalButton: ElementRef | undefined;
  @ViewChild('filterClose') filterCloseButton: ElementRef | undefined;

  offerDetails: any = {
    title: '',
    description: '',
    depart_date: '',
    arrival_date: '',
    itinerary: '',
    volume: '',
    price: '',
    user_id: '',
    username: '',
    picture : '',
  };
  loading: boolean = true;
  public role: string | null = null;
  minDate: string;
  nb : number = 0;
  customIcon:any;
  offersChannel: any;
  constructor(
    private offerService: OfferService,
    private router: Router,
    private formBuilder: FormBuilder,
    public authService: AuthService,
    private datePipe: DatePipe,
    private chatService: ChatService,
    private renderer: Renderer2,
    
  ) {
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

  ngOnInit(): void {
    this.loadOffers();
    this.initializeOfferMap();
    this.map = L.map('map').setView([48.8566, 2.3522], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    const pusher = new Pusher('1c26d2cd463b15a19666', {
      cluster: 'eu',
    });
    this.offersChannel = pusher.subscribe('offers');
    this.offersChannel.bind('update', (data:any) => {
      setTimeout(() => {
        this.loadOffers();
      }, 3000); 
    });
    this.customIcon = L.icon({
      iconUrl: 'assets/img/marker-icon.png', // Path to your custom icon image
      iconSize: [25, 41], // Size of the icon [width, height]
      iconAnchor: [12, 41], // Anchor point of the icon [x, y]
      popupAnchor: [0, -41] // Anchor point of the popup relative to the icon [x, y]
  });
  
    this.routeLayer = L.layerGroup().addTo(this.map);
    const originInput = document.getElementById('origin') as HTMLInputElement;
    const destinationInput = document.getElementById('destination') as HTMLInputElement;
    const originSuggestions = document.getElementById('origin-suggestions') as HTMLUListElement;
    const destinationSuggestions = document.getElementById('destination-suggestions') as HTMLUListElement;
    const destinationSearch = document.getElementById('destinationSearch') as HTMLInputElement;
    const departSearch = document.getElementById('departSearch') as HTMLInputElement;
    const destinationSearchSuggestions = document.getElementById('destinationSearch-suggestions') as HTMLUListElement;
    const departSearchSuggestions = document.getElementById('departSearch-suggestions') as HTMLUListElement;


    this.map.on('click', (e: any) => {
      console.log("map clicked !");
      if (!this.originPin) {
        this.originPin = L.marker(e.latlng ,{draggable: true,icon:this.customIcon} ).addTo(this.map);
       this.reverseGeocode(this.originPin.getLatLng(),originInput);
       
      } else if (!this.destinationPin) {
        this.destinationPin = L.marker(e.latlng ,{draggable: true,icon:this.customIcon}).addTo(this.map);
        this.reverseGeocode(this.destinationPin.getLatLng(),destinationInput);
      }
      // Check if both pins are placed
      if (this.originPin && this.destinationPin && (this.nb ==0)) {
        this.nb = 1;
        this.updateRoute();
        
      }
      this.originPin!.on('dragend',(e:any)=>{
        this.reverseGeocode(this.originPin!.getLatLng(),originInput);
        this.updateRoute();
      });
      this.destinationPin!.on('dragend',()=>{
        this.reverseGeocode(this.destinationPin!.getLatLng(),destinationInput);
        this.updateRoute();
      });
    });
    
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
              this.originPin = L.marker(result.center,{draggable : true,icon:this.customIcon}).addTo(this.map);
              this.offerForm.controls['origin'].setValue(result.name);
              this.offerForm.controls['origin'].updateValueAndValidity();
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
              this.destinationPin = L.marker(result.center ,{draggable : true,icon:this.customIcon}).addTo(this.map);
              this.offerForm.controls['destination'].setValue(result.name);
              this.offerForm.controls['destination'].updateValueAndValidity();
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


   
    destinationSearch.addEventListener('keyup', (event) => {
   
      const query = (event.target as HTMLInputElement).value;
      if (query.length > 2) {
        showSuggestions(query, destinationSearchSuggestions, destinationSearch);
      } else {
        destinationSearchSuggestions.innerHTML = '';
      }
    });

   
    departSearch.addEventListener('keyup', (event) => {
   
      const query = (event.target as HTMLInputElement).value;
      if (query.length > 2) {
        showSuggestions(query, departSearchSuggestions, departSearch);
      } else {
        departSearchSuggestions.innerHTML = '';
      }
    });


  }

  ngAfterViewInit(): void {
   

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
        const noMarkerPlan = new NoMarkerPlan([originLatLng, destinationLatLng], {
          createMarker: () => false // This prevents waypoint markers from being displayed
      });


        this.routeControl = L.Routing.control({
          waypoints: [
            originLatLng,
            destinationLatLng,
          ],
          plan: noMarkerPlan,
          routeWhileDragging: true,
          
          router: new L.Routing.OSRMv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
          }),
         
        }).on('routingerror', function (e) {
          console.error('Routing error: ', e);
          alert('Routing error: ' + e.message);
        }).on('routesfound', (e) => {
          const routes = e.routes;
          const route = routes[0]; // Assuming we take the first route
          this.newOffer.route = JSON.stringify(route) ;
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

  clickCancelButton() {
    if (this.cancelButton) {
      this.cancelButton.nativeElement.click();
    }
  }

  openAddOfferModal() {
    this.showAddOfferModal = true;

  }

  closeAddOfferModal() {
    this.showAddOfferModal = false;
  }
  loadOffers() {
    const cachedOffers = localStorage.getItem('cachedOffers');
  
    if (cachedOffers) {
      this.offers = JSON.parse(cachedOffers);
      this.filteredOffers = [...this.offers];
      this.loading = false;
  
    }
  
    this.offerService.getOffers().subscribe(
      (offers: any[]) => {
        this.offers = offers.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
        this.filteredOffers = [...this.offers];
        this.filteredOffers.forEach(offer=>{
          offer.depart_date = JSON.parse(offer.depart_date);
          offer.arrival_date = JSON.parse(offer.arrival_date);
        });
        //localStorage.setItem('cachedOffers', JSON.stringify(this.offers));
        this.offers = JSON.parse(localStorage.getItem('cachedOffers')!);
        this.filteredOffers = [...this.offers];
        this.loading = false;
      this.applyFilter();
      this.applySmartSearch(this.departSearch,this.destinationSearch);
      },
      
      (error) => {
        this.errorMessage = 'Error fetching offers: ' + error.message;
        this.loading = false;
      }
    );
  }
  

  confirmDelete(id: string) {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      this.deleteOffer(id);
    }
  }

  deleteOffer(id: string) {
    this.offerService.deleteOffer(id).subscribe(
      () => {
        this.offers = this.offers.filter(offer => offer.id !== id);
        this.filteredOffers = [...this.offers];
        localStorage.setItem('cachedOffers', JSON.stringify(this.offers));
      },
      (error) => {
        console.error('Error deleting offer:', error);
      }
    );
  }

  goToEditOffer(id: string) {
    this.router.navigate(['edit-offer/' + id]);
  }

  addOffer() {
    if (this.offerForm.valid) {
      this.newOffer.user_id = this.authService.getUserId();
      
      this.isAdding = true; 
      const departDate = new Date(this.offerForm.get('depart_date')!.value);
      const arrivalDate = new Date(this.offerForm.get('arrival_date')!.value);
  
      if (departDate > arrivalDate) {
        Swal.fire({
          icon: 'error',
          title: 'La date de départ doit être antérieure ou égale à la date d\'arrivée.',
          showConfirmButton: false,
          timer: 1500,
        });
        this.isAdding = false;
        return;
      }
      if (this.originPin && this.destinationPin) {
        this.newOffer.originMap = JSON.stringify(this.originPin.getLatLng());
        this.newOffer.destinationMap = JSON.stringify(this.destinationPin.getLatLng());
      } else {
        // Handle case where origin or destination pins are not set
        Swal.fire({
          icon: 'error',
          title: 'Veuillez indiquer le point de départ et la destination sur la carte.',
          showConfirmButton: false,
          timer: 1500,
        });
        this.isAdding = false;

        return;
      }
      console.log("new offer : ",this.newOffer);
      this.newOffer.depart_date = JSON.stringify(this.newOffer.depart_date);
      this.newOffer.arrival_date = JSON.stringify(this.newOffer.arrival_date);

      this.offerService.addOffer(this.newOffer).subscribe(
        (response) => {
          console.log("response from add offer : ",response);
          Swal.fire({
            icon: 'success',
            title: 'Offre ajouté !',
            showConfirmButton: false,
            timer: 800,
          });
          this.offerForm.reset();
          this.clickCancelButton();
          this.isAdding = false; 
          response.picture = localStorage.getItem('profileImageUrl');
          response.username = this.authService.getDisplayName();
          this.offers.unshift(response);
          this.filteredOffers = [...this.offers];
          localStorage.setItem('cachedOffers', JSON.stringify(this.offers));
        },
        (error) => {
          this.errorMessage = error;
          Swal.fire({
            icon: 'error',
            title: "Erreur lors de l'ajout du l'offre",
            showConfirmButton: false,
            timer: 800,
          });
          this.isAdding = false; 

        }
      );
    }
  }

  openInfoModal(offerId: string) {
    this.mapLoading = true;
    setTimeout(() => {
      this.offerMap.invalidateSize();
    }, 500);
  
    this.offerService.getOfferById(offerId).subscribe(
      (offerDetails: any) => {
        this.offerDetails = offerDetails;
        const originLatLng = JSON.parse(offerDetails.originMap);
        const destinationLatLng = JSON.parse(offerDetails.destinationMap);
        
        // Remove existing layers except tile layer
        this.offerMap.eachLayer((layer: any) => {
          if (!(layer instanceof L.TileLayer)) {
            this.offerMap.removeLayer(layer);
          }

        });
        L.marker(originLatLng, {draggable : false,icon:this.customIcon}).addTo(this.offerMap);
        L.marker(destinationLatLng, {draggable : false,icon:this.customIcon}).addTo(this.offerMap);
        const bounds = new L.LatLngBounds(originLatLng, destinationLatLng);
        this.offerMap.fitBounds(bounds, { padding: [5, 5] });
     
        // Check and parse route coordinates
        const route = this.offerDetails.route;
        if (!route) {
          console.error('Route data is missing in offer details');
          return;
        }
  
        let coordinates;
        try {
          coordinates = JSON.parse(route).coordinates.map((coord: any) => L.latLng(coord.lat, coord.lng));
        } catch (error) {
          console.error('Error parsing route coordinates:', error);
          return;
        }
  
        console.log("offer details route:", route);
        console.log("offer details coordinates:", coordinates);
 
        L.polyline(coordinates, { color: 'blue', weight: 4 }).addTo(this.offerMap);
        this.mapLoading = false;
      },
      (error) => {
        console.error('Error fetching offer details:', error);
      }
    );
  }
  


  initializeOfferMap() {
    // Initialize map with a default location and zoom level
    
    this.offerMap = L.map('modalMap').setView([48.8566, 2.3522], 7);
    // Add tile layer
   
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.offerMap);
    
  }


  public isCompany() : boolean {
    return  this.authService.getRole() == 'company';
  }

  public belongs(user_id : string) : boolean {
    return this.authService.getUserId() == user_id;
  }

  // Method to filter offers based on search query


  applyFilter() {
    console.log('apply filter triggered!!');
    if (this.searchQuery === '') {
      if(this.searchedOffers.length > 0)
      this.filteredOffers = this.searchedOffers;
    else
    this.filteredOffers = this.offers;
    }
    else{
      if(this.searchedOffers.length > 0)
    // Apply search query filter on filteredOffers
    this.filteredOffers = this.searchedOffers.filter(offer =>
      offer.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      offer.description.toLowerCase().includes(this.searchQuery.toLowerCase())
  
    );
    else{
      this.filteredOffers = this.offers.filter(offer =>
        offer.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        offer.description.toLowerCase().includes(this.searchQuery.toLowerCase())
      );  
    }

  }
  }

  refresh() {
    this.loading = true;
    this.filteredOffers = [ ]
    this.offerService.getOffers().subscribe(
      (offers: any[]) => {
        this.offers = offers.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
        this.filteredOffers = [...this.offers];
        this.filteredOffers.forEach(offer=>{
          offer.depart_date = JSON.parse(offer.depart_date);
          offer.arrival_date = JSON.parse(offer.arrival_date);
        });
        localStorage.setItem('cachedOffers', JSON.stringify(this.offers));
        this.loading = false;
        if (this.filterOption == "mine") {
          this.applyFilter();
        }
      },
      (error) => {
        this.errorMessage = 'Error fetching offers: ' + error.message;
        this.loading = false;
      }
    );
  }

  removeBackdrop(): void {
    const backdrop = document.querySelector('.modal-backdrop.fade.show');
    if (backdrop) {
      backdrop.parentNode!.removeChild(backdrop);    }
  }
contacter(receiver_id : string,receiver_display_name:string) {
  this.chatService.createConversation(receiver_id, this.authService.getUserId(),receiver_display_name,this.authService.getDisplayName()!).subscribe(
    (data) => {
      console.log('redirecting to chat....');
      this.removeBackdrop();
      this.router.navigate(['/chat']);
    },
  )
}

mapModal(){
  setTimeout(() => {
    this.map.invalidateSize();
  }, 500);
}

removeAllPins(): void {
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
    this.originPin = L.marker(e.latlng,{draggable : true,icon:this.customIcon}).addTo(this.routeLayer);
    this.reverseGeocode(this.originPin.getLatLng(),document.getElementById('origin') as HTMLInputElement);

  } else if (!this.destinationPin) {
    this.destinationPin = L.marker(e.latlng, {draggable: true,icon:this.customIcon}).addTo(this.routeLayer);
    this.reverseGeocode(this.destinationPin.getLatLng(),document.getElementById('destination') as HTMLInputElement);
  }
  // Check if both pins are placed
  if (this.originPin && this.destinationPin && (this.nb ==0)) {
    this.nb = 1;
    this.updateRoute(); 
   
  }
  
  this.originPin!.on('dragend',(e:any)=>{
    this.reverseGeocode(this.originPin!.getLatLng(),originInput);
    this.updateRoute();
  });
  this.destinationPin!.on('dragend',()=>{
    this.reverseGeocode(this.destinationPin!.getLatLng(),destinationInput);
    this.updateRoute();
  });
});

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
          } else if (inputElement.id === 'destination') {
            this.offerForm.controls['destination'].setValue(results[0].name);
            this.offerForm.controls['destination'].updateValueAndValidity();
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

areAllFieldsFilled(): boolean {
  return (
    this.offerForm.get('title')!.value &&
    this.offerForm.get('description')!.value &&
    this.offerForm.get('depart_date')!.value &&
    this.offerForm.get('arrival_date')!.value &&
    this.offerForm.get('origin')!.value &&
    this.offerForm.get('destination')!.value
  );
}

applySmartSearch(departure: string, destination: string, maxDistance: number = 20): void {
  this.filterLoading= true;

  if (this.filterOption === 'mine' ) {
    // Filter offers to show only the user's offers
    this.filteredOffers = this.offers.filter(offer => offer.user_id === this.authService.getUserId());
  } else {
    // Show all offers
    this.filteredOffers = this.offers;
  }

  if (this.departStartDate ) {
    this.filteredOffers = this.filteredOffers.filter(offer =>
      offer.depart_date >= this.departStartDate! 
    );
  }
  if (this.departEndDate) {
    this.filteredOffers = this.filteredOffers.filter(offer =>
      offer.depart_date <= this.departEndDate!
    );
  }
  if (this.destinationStartDate ) {
    this.filteredOffers = this.filteredOffers.filter(offer =>
      offer.arrival_date >= this.destinationStartDate! 
    );
  }
  if (this.destinationEndDate) {
    this.filteredOffers = this.filteredOffers.filter(offer =>
      offer.arrival_date <= this.destinationEndDate!
    );
  }
  // Apply search query filter on filteredOffers
  
 if(this.departSearch ==='' && this.destinationSearch ===''){
  this.searchedOffers = this.filteredOffers;
  this.filterLoading = false;
  if(this.filterCloseButton){
    this.filterCloseButton.nativeElement.click();
  }
 }
  const geocoder = (L.Control as any).Geocoder.nominatim();
  // Geocode the departure address
  geocoder.geocode(departure, (departResults: any) => {
    if (departResults.length === 0) {
      console.error('Departure address not found');
      return;
    }
    const departLatLng = new L.LatLng(departResults[0].center.lat, departResults[0].center.lng);

    // Geocode the destination address
    geocoder.geocode(destination, (destinationResults: any) => {
      if (destinationResults.length === 0) {
        console.error('Destination address not found');
        return;
      }
      const destinationLatLng = new L.LatLng(destinationResults[0].center.lat, destinationResults[0].center.lng);

      this.filteredOffers = this.filteredOffers.filter(offer => {
        if (offer.route) {
          const route = JSON.parse(offer.route);
          const routeCoords = route.coordinates.map((coord: any) => [coord.lng, coord.lat]);

          // Convert route coordinates to a LineString for turf.js
          const line = turf.lineString(routeCoords);

          // Convert depart and destination points to turf points
          const departPoint = turf.point([departLatLng.lng, departLatLng.lat]);
          const destinationPoint = turf.point([destinationLatLng.lng, destinationLatLng.lat]);

          // Check if depart and destination points are within maxDistance of the route
          const departNearRoute = turf.nearestPointOnLine(line, departPoint, { units: 'kilometers' }).properties.dist <= maxDistance;
          const destinationNearRoute = turf.nearestPointOnLine(line, destinationPoint, { units: 'kilometers' }).properties.dist <= maxDistance;

          if (departNearRoute && destinationNearRoute) {
            // Ensure depart point comes before destination point along the route
            const departIndex = routeCoords.findIndex(([lng, lat]: [number, number]) => {
              return turf.distance(turf.point([lng, lat]), departPoint, { units: 'kilometers' }) <= maxDistance;
            });

            const destinationIndex = routeCoords.findIndex(([lng, lat]: [number, number]) => {
              return turf.distance(turf.point([lng, lat]), destinationPoint, { units: 'kilometers' }) <= maxDistance;
            });

            return departIndex !== -1 && destinationIndex !== -1 && departIndex < destinationIndex;
          }

          return false;
        }

        return false;
      });
      this.searchedOffers = this.filteredOffers;

    });
    this.filterLoading = false;
    if(this.filterCloseButton){
      this.filterCloseButton.nativeElement.click();
    }
  });

}

filterFields(){
  if((this.departSearch !='' && this.destinationSearch == '') || (this.departSearch =='' && this.destinationSearch !='')){
    this.filterButton = true;
  }
  else{
    this.filterButton = false;
  }
}

resetForm() {
  this.departSearch = '';
  this.destinationSearch = '';
  this.departStartDate = null;
  this.departEndDate = null;
  this.destinationStartDate = null;
  this.destinationEndDate = null;
  this.filterOption = 'all';
  this.filteredOffers = this.offers;
  this.searchQuery = '';
}
}
