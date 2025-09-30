import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, Renderer2, NgZone } from '@angular/core';
import { OfferService } from '../services/offer.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { DatePipe, JsonPipe } from '@angular/common';
import { ChatService } from '../services/chat.service';
import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/slider'; // Import the slider widget explicitly
import * as noUiSlider from 'nouislider';

import Pusher from 'pusher-js';
import { MapService } from '../services/map.service';
import { map, take } from 'rxjs/operators';

declare global {
  interface JQuery {
    slider(options?: any): JQuery;
    slider(method: string, param1?: any, param2?: any): any;
  }
}

@Component({
  selector: 'app-offer-list',
  templateUrl: './offer-list.component.html',
  styleUrls: ['./offer-list.component.html'],
})


export class OfferListComponent implements OnInit, AfterViewInit {
  public isSousTraitance = false;
  floorNumbers: number[] = Array.from({ length: 30 }, (_, i) => i + 1);
  isTableView = false;
  etages: any[] = [];
  minEndDate1: Date = new Date() ;
  minEndDate2: Date = new Date() ;
  minEndDate3: Date = new Date() ;
  user_id : string = '';
  departStartDate: Date | string | null = new Date();
  departEndDate: Date | null = null;
  destinationStartDate: Date | null = null;
  destinationEndDate: Date | null = null;
  searchedOffers:any[] = [];
  isAdding: boolean = false;
  isUpdating: boolean = false;
  departSearch : string ='';
  destinationSearch : string ='';
  filterLoading : boolean= false;
  map: any;
  filterButton : boolean = false;
  selectedDateRange: any ;
  offerMap : any;
  itinerary: string = '';
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
    depart_date_start: '',
    depart_date_end: '',
    destination_date_start: '',
    destination_date_end: '',
    origin:undefined,
    destination :undefined,
    route: '',
    volume: 0,
    prix:0,
    reference:'',
    type_offre:0,
    depart_etage:'',
    arrivee_etage:'',
    depart_pres:'',
    arrivee_pres:'',
    commentaire:'',
    escalier_depart:false,
    ascenseur_depart:false,
    monte_meuble_depart:false,
    direct_depart:false,
    escalier_arrivee:false,
    ascenseur_arrivee:false,
    monte_meuble_arrivee:false,
    direct_arrivee:false,
    
  };
  filter: any = {
  
    depart_date_start: '',
    depart_date_end: '',
    destination_date_start: '',
    destination_date_end: '',
    origin:undefined,
    destination :undefined,
    route: '',
    volume: 0,
    prix:0,
    all:'all'
  };
  volumeMin: number = 0;
  volumeMax: number = 1000;
  priceMin: number = 0;
  priceMax: number = 5000;
  updateOffer: any = {
    
    depart_date_start: '',
    depart_date_end: '',
    destination_date_start: '',
    destination_date_end: '',
    origin:undefined,
    destination :undefined,
    route: '',
    volume: 0,
    prix:0,
  };
  offerForm!: FormGroup;
  @ViewChild('cancelButton') cancelButton: ElementRef | undefined;
  @ViewChild('addOfferModal') addOfferModalButton: ElementRef | undefined;
  @ViewChild('filterClose') filterCloseButton: ElementRef | undefined;
  @ViewChild('updateOfferModal') updateCloseButton: ElementRef | undefined;

  display_name: string ='';
  loading: boolean = true;
  public role: string | null = null;
  minDate: string;
  nb : number = 0;
  customIcon:any;
  offersChannel: any;
  displayRegions$ = this.mapService.displayRegions$;
  selectedRegion$ = this.mapService.selectedRegions$;
  selectedFilterRegion$ = this.mapService.selectedFilterRegions$;
  offerTypes: any[] = [];
  constructor(
    private offerService: OfferService,
    private router: Router,
    private formBuilder: FormBuilder,
    public authService: AuthService,
    private datePipe: DatePipe,
    private chatService: ChatService,
    private renderer: Renderer2,
    private ngZone: NgZone,
    public mapService: MapService
    
  ) {
    this.authService.getUser().subscribe(
      data => {
        this.user_id = data.id;
      },
      error => {
        console.error('Error fetching user info', error);
      }
    );
    console.log('retrieved user id: ',this.user_id);
    this.departStartDate = this.datePipe.transform(this.departStartDate, 'dd-MM-yyyy');
    this.minDate = this.offerService.getMinDate();
    this.offerForm = this.formBuilder.group({
      depart_date_start: ['', Validators.required],
      depart_date_end: [''],
      arrival_date_start: ['', Validators.required],
      arrival_date_end: [''],
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      volume: ['', Validators.required],
      prix: ['', Validators.required],
      reference:['',Validators.required],
      type_offre:['',Validators.required],
      depart_etage:['',Validators.required],
      arrivee_etage:['',Validators.required],
      depart_pres:['',Validators.required],
      arrivee_pres:['',Validators.required],
      commentaire:[''],
      escalier_depart:[''],
      ascenseur_depart:[''],
      monte_meuble_depart:[''],
      direct_depart:[''],
      escalier_arrivee:[''],
      ascenseur_arrivee:[''],
      monte_meuble_arrivee:[''],
      direct_arrivee:[''],

      // Add other form controls here
  });
  }

  ngOnInit(): void {
       // Retrieve user info from local storage
       this.authService.getUser().subscribe(
        data => {
          this.display_name = data.name;
        },
        error => {
          console.error('Error fetching user info', error);
        }
      );
    //-----JS for Price Range slider-----
    this.offerService.getOffreTypes().subscribe(data => {
      this.offerTypes = data;
    });
   this.etages = [
      { label: 'RDC -2', value: 'RDC -2' },
      { label: 'RDC -1', value: 'RDC -1' },
      { label: 'RDC', value: 'RDC' },
      ...Array.from({ length: 30 }, (_, i) => ({
        label: `${i + 1}e étage`,
        value: `${i + 1}`
      }))
    ];
    
$(function() {
	$( "#slider-range").slider({
	  range: true,
	  min: 100,
	  max: 5000,
	  values: [ 100, 5000 ],
	  slide: function( event : any, ui : any ) {
		$( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
	  }
	});
	(($( "#amount" ).val( "$" + $( "#slider-range" ))as any).slider( "values", 0 ) +
	  (" - $" + $( "#slider-range" )as any).slider( "values", 1 ) );
});
    this.selectedRegion$.subscribe((regions) => {
      if(regions.length > 0){
     this.newOffer.origin= regions[0].id
     if(regions.length > 1){
    this.newOffer.destination = regions[regions.length-1].id;}}})
        console.log(this.selectedFilterRegion$);
    this.selectedFilterRegion$.subscribe((regions) => {
      if(regions.length > 0){
     this.filter.origin= regions[0].id
     if(regions.length > 1){
    this.filter.destination = regions[regions.length-1].id;}}})
    console.log(this.displayRegions$)
    this.loadOffers();
  
    const pusher = new Pusher('1c26d2cd463b15a19666', {
      cluster: 'eu',
    });
    this.offersChannel = pusher.subscribe('offers');
    this.offersChannel.bind('update', (data:any) => {
      setTimeout(() => {
        this.loadOffers();
      }, 3000); 
    });
  

    this.offerForm.get('type_offre')!
    .valueChanges
    .subscribe(value => {
      this.isSousTraitance = (value == 4);
      console.log("is sous traitance: ",this.isSousTraitance);

      const departEtage     = this.offerForm.get('depart_etage')!;
      const departPres   = this.offerForm.get('depart_pres')!;
      const arriveeEtage    = this.offerForm.get('arrivee_etage')!;
      const arriveePres  = this.offerForm.get('arrivee_pres')!;

      if (this.isSousTraitance) {
        // Add required validators
        departEtage.setValidators([ Validators.required ]);
        departPres.setValidators([ Validators.required ]);
        arriveeEtage.setValidators([ Validators.required ]);
        arriveePres.setValidators([ Validators.required ]);
      } else {
        // Remove validators
        departEtage.clearValidators();
        departPres.clearValidators();
        arriveeEtage.clearValidators();
        arriveePres.clearValidators();
      }
      if(value ===  6){
        this.offerForm.get('prix')?.clearValidators();
        this.offerForm.get('prix')?.setValue(0);
      }
      else{
        this.offerForm.get('prix')?.setValidators([Validators.required]);
      }
      // Re-run validation
      [departEtage, departPres, arriveeEtage, arriveePres]
        .forEach(ctrl => ctrl.updateValueAndValidity());
    });



  }

  ngAfterViewInit() {
    // Initialize Volume Slider
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
      noUiSlider.create(volumeSlider, {
        start: [this.volumeMin, this.volumeMax],
        connect: true,
        range: {
          min: 0,
          max: 1000
        },
        step: 1
      }).on('update', (values: (string | number)[], handle: number, unencoded?: number[]) => {
        this.ngZone.run(() => {
          const val = Math.round(+values[handle]);
          if (handle === 0) {
            this.volumeMin = val;
          } else {
            this.volumeMax = val;
          }
        });
      });
    }

    // Initialize Price Slider
    const priceSlider = document.getElementById('price-slider');
    if (priceSlider) {
      noUiSlider.create(priceSlider, {
        start: [this.priceMin, this.priceMax],
        connect: true,
        range: {
          min: 0,
          max: 5000
        },
        step: 10
      }).on('update', (values: (string | number)[], handle: number, unencoded?: number[]) => {
        this.ngZone.run(() => {
          const val = Math.round(+values[handle]);
          if (handle === 0) {
            this.priceMin = val;
          } else {
            this.priceMax = val;
          }
        });
      });
    }
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
    if (this.cancelButton) {
      this.cancelButton.nativeElement.click();
    }
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
        this.offers = offers.sort((a, b) => new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime());
        console.log(offers);
        //localStorage.setItem('cachedOffers', JSON.stringify(this.offers));
        this.loading = false;
        this.filteredOffers = [...this.offers];
        
      },
      
      (error) => {
       // this.errorMessage = 'Error fetching offers: ' + error.message;
       // this.loading = false;
      }
    );

  }
  

  confirmDelete(id: string) {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      this.deleteOffer(id);
    }
  }

  deleteOffer(id: string) {
    Swal.fire({
      title: 'Voulez-vous vraiment supprimer cette offre?',
      text: "Cette action est irréversible!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
     
    this.offerService.deleteOffer(id).subscribe(
      () => {
       Swal.fire({
        title: 'Offre supprimée avec succès',
        icon: 'success',
        showConfirmButton: false,
        timer: 1500,
      });
        this.loadOffers();
        this.applyFilter();
      },
      (error) => {
        console.error('Error deleting offer:', error);
      }
    );}
    });
  
  }

  goToEditOffer(id: string) {
    this.router.navigate(['edit-offer/' + id]);
  }

  addOffer() {
    this.isAdding = true;
    if (this.offerForm.valid) {
      const d1 = document.getElementById('departStartDate') as HTMLInputElement;
      const d2 = document.getElementById('departEndDate') as HTMLInputElement;
      const d3 = document.getElementById('destinationStartDate') as HTMLInputElement;
      const d4 = document.getElementById('destinationEndDate') as HTMLInputElement;
     // Ensures min updates dynamically
     console.log(d2)
      this.newOffer.depart_date_start = (new Date(d1.value)).toISOString().split('T')[0];
      this.newOffer.destination_date_start = (new Date(d3.value)).toISOString().split('T')[0];
      
       this.newOffer.depart_date_end = d2 && d2.value? (new Date(d2.value)).toISOString().split('T')[0] : null;
      this.newOffer.destination_date_end = d4 && d4.value ? (new Date(d4.value)).toISOString().split('T')[0] : null;
      this.selectedRegion$.pipe(
        map(regions => regions.map(region => region.id).join(','))
      ).subscribe(routeString => {
        this.newOffer.route = routeString;
      });
      
  }
  console.log(this.newOffer);
  this.newOffer.origin= this.newOffer.origin.length >1 ? this.newOffer.origin : "0"+this.newOffer.origin;
  this.newOffer.destination= this.newOffer.destination.length >1 ? this.newOffer.destination : "0"+this.newOffer.destination;
  this.newOffer.user_id = this.user_id;
  this.offerService.addOffer(this.newOffer).subscribe(
     (response)=>{
  this.isAdding = false;
  this.resetAddForm();
  this.closeAddOfferModal();
  Swal.fire({
    title: 'Offre ajoutée avec succès',
    icon: 'success',
    showConfirmButton: false,
    timer: 1500,
  });
this.loadOffers();},
  (error)=>{
    this.isAdding = false;
    Swal.fire({
      title: 'Erreur lors de l\'ajout de l\'offre',
      icon: 'error',
      showConfirmButton: false,
      timer: 1500,
    });
  }
  );
}


resetAddForm() {
   // If you're using Reactive Forms
  this.newOffer = {
    user_id: '',
    depart_date_start: '',
    depart_date_end: '',
    destination_date_start: '',
    destination_date_end: '',
    origin:undefined,
    destination :undefined,
    route: '',
    volume: 0,
    prix:0,
    reference:'',
    type_offre:0,
    depart_etage:'',
    arrivee_etage:'',
    depart_pres:'',
    arrivee_pres:'',
    commentaire:'',
    escalier_depart:false,
    ascenseur_depart:false,
    monte_meuble_depart:false,
    direct_depart:false,
    escalier_arrivee:false,
    ascenseur_arrivee:false,
    monte_meuble_arrivee:false,
    direct_arrivee:false,
  };
  const d1 = document.getElementById('departStartDate') as HTMLInputElement | null;
  const d2 = document.getElementById('departEndDate') as HTMLInputElement | null;
  const d3 = document.getElementById('destinationStartDate') as HTMLInputElement | null;
  const d4 = document.getElementById('destinationEndDate') as HTMLInputElement | null;

  if (d1) d1.value = '';
  if (d2) d2.value = '';
  if (d3) d3.value = '';
  if (d4) d4.value = '';

  $('.add-map').find('.land.selected').removeClass('selected');
}


openInfoModal(offerId: number) {
  $('.info-map .land.selected').removeClass('selected');
  this.mapLoading = true;
  const offer = this.offers.find(offer => offer.id_offre === offerId);
  console.log("offer Id: ",offerId);
  if (!offer || !offer.route) {
    console.error("Offer not found or route is missing.");
    return;
  }

  const departmentIds = offer.route.split(',').map(String);
  console.log("departmentIds:", departmentIds);
  
setTimeout(() => {
  departmentIds.forEach((deptId: { toString: () => string; }, index: number) => {
    setTimeout(() => {
      console.log("Selecting region:", deptId.toString());
      this.mapService.selectRegion2(deptId.toString());

      // Set `mapLoading = false` only after the last region is selected
      if (index === departmentIds.length - 1) {
        this.mapLoading = false;
      }
    }, (index * 1000) / departmentIds.length  ); // Progressive delay for each region
  });
}, 500);
}





  public belongs(user_id : string) : boolean {
    return this.user_id == user_id;
  }

  // Method to filter offers based on search query


  applyFilter() {
    // Get filter date input elements and update filter properties
    const departStart = document.getElementById('departStartFilter') as HTMLInputElement;
    const departEnd = document.getElementById('departEndFilter') as HTMLInputElement;
    const destinationStart = document.getElementById('destinationStartFilter') as HTMLInputElement;
    const destinationEnd = document.getElementById('destinationEndFilter') as HTMLInputElement;
    
    this.filter.depart_date_start = departStart.value;
    this.filter.depart_date_end = departEnd.value;
    this.filter.destination_date_start = destinationStart.value;
    this.filter.destination_date_end = destinationEnd.value;
    
    console.log('apply filter triggered!!');
    this.filterLoading = true;
  
    // Convert filter date values to Date objects (if provided)
    const filterDepartStart = this.filter.depart_date_start ? new Date(this.filter.depart_date_start) : null;
    const filterDepartEnd = this.filter.depart_date_end ? new Date(this.filter.depart_date_end) : null;
    const filterDestStart = this.filter.destination_date_start ? new Date(this.filter.destination_date_start) : null;
    const filterDestEnd = this.filter.destination_date_end ? new Date(this.filter.destination_date_end) : null;
  
    // Get the current selected regions from the observable
    this.selectedFilterRegion$.pipe(take(1)).subscribe(selectedRegions => {
      const selectedRegionIds = selectedRegions.map(region => region.id);
      if( this.filter.origin && this.filter.origin.length ==1) this.filter.origin = "0"+this.filter.origin;
      if( this.filter.destination && this.filter.destination.length ==1) this.filter.destination = "0"+this.filter.destination;
      this.filteredOffers = this.offers.filter(offer => {
        let matchOrigin = !this.filter.origin || offer.origin === this.filter.origin || offer.route.includes(this.filter.origin);
        let matchDestination = !this.filter.destination || offer.destination === this.filter.destination || offer.route.includes(this.filter.destination);
        const matchVolume = offer.volume >= this.volumeMin && offer.volume <= this.volumeMax;
        const matchPrice = offer.prix >= this.priceMin && offer.prix <= this.priceMax;
        let allOffers = true;
        if(this.filter.all == 'mine'){ 
          allOffers = offer.user == this.user_id;
        }
        // Region matching: true if either all selected region IDs exist in the offer route
        // or all offer route IDs exist in the selected region IDs.
        const offerRouteIds = offer.route.split(',');
        let matchRegion = selectedRegionIds.length === 0 ||
                          selectedRegionIds.every(id => offerRouteIds.includes(id)) ||
                          offerRouteIds.every((id: string) => selectedRegionIds.includes(id));
  
        // ----- Departure Date Filtering -----
        let matchDepartDate = true;
        const offerDepartStart = offer.depart_date_start ? new Date(offer.depart_date_start) : null;
        const offerDepartEnd = offer.depart_date_end ? new Date(offer.depart_date_end) : null;
        
        if (filterDepartStart) {
          if (offerDepartStart) {
            if (!offerDepartEnd && !filterDepartEnd) {
              // Both offer and filter only have a start date; compare them directly.
              matchDepartDate = offerDepartStart.getTime() === filterDepartStart.getTime();
            } else if (!offerDepartEnd && filterDepartEnd) {
              // Offer has only a start date; filter provides a range.
              matchDepartDate = (offerDepartStart >= filterDepartStart && offerDepartStart <= filterDepartEnd);
            } else if (offerDepartEnd && !filterDepartEnd) {
              // Offer has a range; filter only provides a start date.
              matchDepartDate = (filterDepartStart >= offerDepartStart && filterDepartStart <= offerDepartEnd);
            } else if (offerDepartEnd && filterDepartEnd) {
              // Both offer and filter provide ranges; check if the offer's start is within the filter range.
              matchDepartDate = (offerDepartStart >= filterDepartStart && offerDepartStart <= filterDepartEnd);
            }
          } else {
            matchDepartDate = false;
          }
        }
  
        // ----- Destination Date Filtering -----
        let matchDestinationDate = true;
        const offerDestStart = offer.destination_date_start ? new Date(offer.destination_date_start) : null;
        const offerDestEnd = offer.destination_date_end ? new Date(offer.destination_date_end) : null;
  
        if (filterDestStart) {
          if (offerDestStart) {
            if (!offerDestEnd && !filterDestEnd) {
              // Both offer and filter only have a start date; compare directly.
              matchDestinationDate = offerDestStart.getTime() === filterDestStart.getTime();
            } else if (!offerDestEnd && filterDestEnd) {
              // Offer has only a start date; filter provides a range.
              matchDestinationDate = (offerDestStart >= filterDestStart && offerDestStart <= filterDestEnd);
            } else if (offerDestEnd && !filterDestEnd) {
              // Offer has a range; filter only provides a start date.
              matchDestinationDate = (filterDestStart >= offerDestStart && filterDestStart <= offerDestEnd);
            } else if (offerDestEnd && filterDestEnd) {
              // Both offer and filter provide ranges; check if the offer's start is within the filter range.
              matchDestinationDate = (offerDestStart >= filterDestStart && offerDestStart <= filterDestEnd);
            }
          } else {
            matchDestinationDate = false;
          }
        }
     
        // Combine all filter conditions
        return matchVolume && matchPrice &&
               matchDepartDate && matchDestinationDate &&
               matchOrigin && matchDestination && matchRegion && allOffers;
      });
  
      this.filterLoading = false;
      this.filterCloseButton?.nativeElement.click();
      console.log(selectedRegions);
    });
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

}

mapModal(){
  this.offerForm.reset();
  setTimeout(() => {
    this.map.invalidateSize();
  }, 500);
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


filterFields(){
 
}

resetForm() {

  this.filteredOffers = this.offers;
  this.filter = {
    depart_date_start: '',
    depart_date_end: '',
    destination_date_start: '',
    destination_date_end: '',
    origin:undefined,
    destination :undefined,
    route: '',
    volume: 0,
    prix:0,
  };
  this.filterCloseButton?.nativeElement.click();
  this.resetMap(".filter-map");
}
resetMap(c : String): void {
  this.mapService.resetMap(c);
}


updateMinDate1() {
  const minEndDate = document.getElementById('departStartDate') as HTMLInputElement;

  this.minEndDate1 = new Date(minEndDate.value);
  this.minEndDate3 = new Date(minEndDate.value);
 // Ensures min updates dynamically
  console.log("depart start date : ",this.minEndDate1.toISOString().split('T')[0]);
  
}
updateMinDate2() {
  const minEndDate = document.getElementById('destinationStartDate') as HTMLInputElement;

  this.minEndDate2 = new Date(minEndDate.value);
 // Ensures min updates dynamically
  console.log("depart start date : ",this.minEndDate2.toISOString().split('T')[0]);
  
}
updateMinDate3() {
  const minEndDate = document.getElementById('departEndDate') as HTMLInputElement;

  this.minEndDate3 = new Date(minEndDate.value);
 // Ensures min updates dynamically
  console.log("depart start date : ",this.minEndDate3.toISOString().split('T')[0]);
  
}

validateNumber(event: KeyboardEvent) {
  const charCode = event.key;
  if (!/^\d$/.test(charCode)) {
    event.preventDefault(); // Prevent non-numeric input
  }
  
}

updateOfferDetails() {
  if (!this.offerForm.valid) return;
  this.isUpdating = true;

  const vals = this.offerForm.value;
  const payload = {
    ...this.updateOffer,
    ...vals,
    // ensure ISO dates
    depart_date_start:  new Date(vals.depart_date_start).toISOString().slice(0,10),
    destination_date_start: new Date(vals.arrival_date_start).toISOString().slice(0,10),
    depart_date_end:    vals.depart_date_end
                          ? new Date(vals.depart_date_end).toISOString().slice(0,10)
                          : null,
    destination_date_end: vals.arrival_date_end
                          ? new Date(vals.arrival_date_end).toISOString().slice(0,10)
                          : null
  };

  // rebuild route from selected regions
  this.selectedRegion$
    .pipe(take(1))
    .subscribe(regs => {
      payload.route = regs.map(r => r.id).join(',');
      this.offerService.updateOffer(payload.id_offre, payload)
        .subscribe(
          _ => {
            this.isUpdating = false;
            this.closeUpdateOfferModal();
            Swal.fire({ title: 'Offre modifiée avec succès', icon: 'success', timer: 1500, showConfirmButton: false });
            this.loadOffers();
            this.applyFilter();
          },
          _ => {
            this.isUpdating = false;
            Swal.fire({ title: 'Erreur lors de la modification', icon: 'error', timer: 1500, showConfirmButton: false });
          }
        );
    });
}



openEditOfferModal(offer: any) {
  this.mapService.resetMap(".update-map");
  this.updateOffer = offer;
  
    this.updateOffer = { ...offer };
  
    // patch every control at once
    this.offerForm.patchValue({
      type_offre:      offer.type_offre,
      reference:       offer.reference,
      depart_date_start:    offer.depart_date_start,
      depart_date_end:      offer.depart_date_end,
      arrival_date_start:   offer.destination_date_start,
      arrival_date_end:     offer.destination_date_end,
      origin:          offer.origin,
      destination:     offer.destination,
      volume:          offer.volume,
      prix:            offer.prix,
      depart_etage:    offer.depart_etage,
      arrivee_etage:   offer.arrivee_etage,
      depart_pres:     offer.depart_pres,
      arrivee_pres:    offer.arrivee_pres,
      commentaire:     offer.commentaire,
      escalier_depart:     offer.escalier_depart,
      ascenseur_depart:    offer.ascenseur_depart,
      monte_meuble_depart: offer.monte_meuble_depart,
      direct_depart:       offer.direct_depart,
      escalier_arrivee:    offer.escalier_arrivee,
      ascenseur_arrivee:   offer.ascenseur_arrivee,
      monte_meuble_arrivee:offer.monte_meuble_arrivee,
      direct_arrivee:      offer.direct_arrivee
    });
  
  
  

  if (!offer || !offer.route) {
    console.error("Offer not found or route is missing.");
    return;
  }

  const departmentIds = offer.route.split(',').map(String);
  console.log("departmentIds:", departmentIds);
  
setTimeout(() => {
  departmentIds.forEach((deptId: { toString: () => string; }, index: number) => {
    setTimeout(() => {
      console.log("Selecting region:", deptId.toString());
      this.mapService.selectRegion3(deptId.toString());

      // Set `mapLoading = false` only after the last region is selected
      if (index === departmentIds.length - 1) {
        this.mapLoading = false;
      }
    }, (index * 1000) / departmentIds.length  ); // Progressive delay for each region
  });
}, 500);
}

closeUpdateOfferModal(){
  if (this.updateCloseButton) {
    this.updateCloseButton.nativeElement.click();
  }
  this.offerForm.reset();
}
updateRange(type: string) {
  if (type === "volume") {
      if (this.volumeMin > this.volumeMax) {
          this.volumeMin = this.volumeMax;
      }
  } else if (type === "price") {
      if (this.priceMin > this.priceMax) {
          this.priceMin = this.priceMax;
      }
  }
}

checkLength(c:string){
  return c.length ==0 || c.length == 2;
}


toggleView() {
  this.isTableView = !this.isTableView;
}

  trackByFloor(_idx: number, floor: number): number {
    return floor;
  }


  trackById(_idx: number, item: any) {
    return item.id_offre;
  }
}