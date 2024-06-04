import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { OfferService } from '../services/offer.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { DatePipe, formatDate } from '@angular/common';
import { ChatComponent } from '../chat/chat.component';
import { ChatService } from '../services/chat.service';
import * as $ from 'jquery';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import * as LCG from 'leaflet-control-geocoder';

@Component({
  selector: 'app-list-offers-visitor',
  templateUrl: './list-offers-visitor.component.html',
  styleUrls: ["./assets/css/main.css"]
})
export class ListOffersVisitorComponent implements OnInit {
  isAdding: boolean = false;
  map: any;
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
  customIcon : any;
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
    this.customIcon = L.icon({
      iconUrl: './assets/img/marker-icon.png', // Path to your custom icon image
      iconSize: [38, 38], // Size of the icon [width, height]
      iconAnchor: [22, 22], // Anchor point of the icon [x, y]
      popupAnchor: [-3, -76] // Anchor point of the popup relative to the icon [x, y]
  });
    this.loadOffers();
    this.initializeOfferMap();
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
      if (this.filterOption === "mine") {
        this.applyFilter();
      }
    }
  
    this.offerService.getOffers().subscribe(
      (offers: any[]) => {
        this.offers = offers.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
        this.filteredOffers = [...this.offers];
        localStorage.setItem('cachedOffers', JSON.stringify(this.offers));
        this.offers = JSON.parse(localStorage.getItem('cachedOffers')!);
        this.filteredOffers = [...this.offers];
        this.loading = false;
        if (this.filterOption === "mine") {
          this.applyFilter();
        }
      },
      (error) => {
        this.errorMessage = 'Error fetching offers: ' + error.message;
        this.loading = false;
      }
    );
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
        L.marker(originLatLng, {draggable : false,icon: this.customIcon }).addTo(this.offerMap);
        L.marker(destinationLatLng, {draggable : false}).addTo(this.offerMap);
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


 

  // Method to filter offers based on search query


  applyFilter() {
    if (this.filterOption === 'mine' ) {
      // Filter offers to show only the user's offers
      this.filteredOffers = this.offers.filter(offer => offer.user_id === this.authService.getUserId());
    } else {
      // Show all offers
      this.filteredOffers = this.offers;
    }
  
    // Apply search query filter on filteredOffers
    this.filteredOffers = this.filteredOffers.filter(offer =>
      offer.depart_date.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      offer.origin.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      offer.destination.toLowerCase().includes(this.searchQuery.toLowerCase())
  
    );
  }



  removeBackdrop(): void {
    const backdrop = document.querySelector('.modal-backdrop.fade.show');
    if (backdrop) {
      backdrop.parentNode!.removeChild(backdrop);    }
  }


mapModal(){
  setTimeout(() => {
    this.map.invalidateSize();
  }, 500);
}




}
