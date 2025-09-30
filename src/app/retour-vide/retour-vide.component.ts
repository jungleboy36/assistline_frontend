import { AfterViewInit, Component } from '@angular/core';
import * as $ from 'jquery';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { RetourVideService } from '../services/retour-vide.service';
import Swal from 'sweetalert2';
import { MapService } from '../services/map.service';
import { map, concatMap, take, catchError } from 'rxjs/operators';
import { interval, Observable, of, Subscription } from 'rxjs';
import { Proposition, PropositionService } from '../services/proposition.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import 'leaflet-control-geocoder';
import * as L from 'leaflet';


export const dateRangesValidator: ValidatorFn = (
  group: AbstractControl
): ValidationErrors | null => {
  const ds = group.get('depart_date_start')?.value;
  const de = group.get('depart_date_end')?.value;
  const as = group.get('arrival_date_start')?.value;
  const ae = group.get('arrival_date_end')?.value;

  const errors: any = {};

  // départ start ≤ départ end
  if (ds && de && new Date(ds) > new Date(de)) {
    errors.departRange = 'La date de début doit être antérieure à la date de fin de départ';
  }
  // arrivée start ≤ arrivée end
  if (as && ae && new Date(as) > new Date(ae)) {
    errors.arrivalRange = 'La date de début doit être antérieure à la date de fin de livraison';
  }
  // livraison commence après fin de départ
  if (de && as && new Date(de) > new Date(as)) {
    errors.sequence = 'La période de livraison doit commencer après la période de départ';
  }

  return Object.keys(errors).length ? errors : null;
};
interface NominatimPlace {
  display_name: string;
  lat: string;
  lon: string;
  // (other fields omitted for brevity)
}

@Component({
  selector: 'app-retour-vide',
  templateUrl: './retour-vide.component.html',
  styleUrls: ['./retour-vide.component.css']
})
export class RetourVideComponent implements AfterViewInit{
    private nominatimGeocoder!: any;
  chargementSuggestions: NominatimPlace[] = [];
  livraisonSuggestions: NominatimPlace[] = [];
  floors: string[] = []; // will hold "RDC","1","2",…,"30"
  propositionForm!: FormGroup;
    activeRetourId!: number;   
      isSubmittingProp = false;
  selectedRegion$ = this.mapService.selectedRegions$;
  isTableView: boolean = true;
  retourForm!: FormGroup;
  addloading: boolean = false;
  private sub!: Subscription;
  todayString!: string;
  user_id:any;
  originName: string = '';
  destinationName: string = '';
  private typingSpeed = 80;
  retourVides: any[] = [];
constructor(private fb: FormBuilder,
  private retourService: RetourVideService, 
  public mapService : MapService,private authService: AuthService, 
  private router: Router,
  private http: HttpClient, 
    private propositionService: PropositionService,) {
          this.floors = ['RDC', ...Array.from({ length: 30 }, (_, i) => (i + 1).toString())];
  this.retourForm = this.fb.group({
    depart_date_start:   [null, [Validators.required, this.dateNotPastValidator()]],
    depart_date_end:     [null, [this.minDateValidator('depart_date_start')]],
    arrival_date_start:  [null, [Validators.required, this.dateNotPastValidator()]],
    arrival_date_end:    [null, [ this.minDateValidator('arrival_date_start')]],
    volume:              [null, [Validators.required, Validators.min(1)]],
    typeCamion:        ['',   Validators.required],
    avecHayon:         ['',   Validators.required],
    detour:            ['',   Validators.required],
    origin:              ['', []],    // start with no validators
    destination:         ['', []],
    itineraire:          ['', []]
  },{
    validators: dateRangesValidator   // ← attach cross-field checks here
  });
  this.todayString = new Date().toISOString().split('T')[0];

  this.sub = this.retourForm.get('depart_date_start')!
      .valueChanges.subscribe(() => {
        this.retourForm.get('depart_date_end')!.updateValueAndValidity();
      });
    this.sub.add(
      this.retourForm.get('arrival_date_start')!
        .valueChanges.subscribe(() => {
          this.retourForm.get('arrival_date_end')!.updateValueAndValidity();
        })
    );
}

ngOnInit(): void {
  this.loadRetourVides();

     this.propositionForm = this.fb.group({
      retour: [null, Validators.required],

      // Particulier fields (only required if user_pro is absent)
      civility:   ['', Validators.required],           // Now required
      first_name: ['', Validators.required],
      last_name:  ['', Validators.required],
      email:      ['', [Validators.required, Validators.email]],
      phone:      ['', Validators.required],

      // Proposition details
      volume_propose: [null, [Validators.required, Validators.min(0.01)]],
      biens:          ['', Validators.required],

      periode_souhaitee_start: [null, [Validators.required, this.dateNotPastValidator()]],
      periode_souhaitee_end:   [null, [Validators.required, this.minDateValidator('periode_souhaitee_start')]],

      flexibilite: [0, Validators.required],

      adresse_chargement: ['', Validators.required],
      etage_chargement:   ['', Validators.required],
      passage_chargement: ['', Validators.required],

      adresse_livraison:  ['', Validators.required],
      etage_livraison:    ['', Validators.required],
      passage_livraison:  ['', Validators.required]
      // statut & code_confidentiel sont en lecture seule
    });

  this.authService.getUser().subscribe(
    data => {
      this.user_id = data.id;
    },
    error => {
      console.error('Error fetching user info', error);
    }
  );
 

  const createTyping = (full: string) =>
    interval(this.typingSpeed).pipe(
      take(full.length),
      map(i => full.substring(0, i + 1))
    );

  const createDeleting = (cur: string) =>
    cur
      ? interval(this.typingSpeed).pipe(
          take(cur.length),
          map(i => cur.substring(0, cur.length - i - 1))
        )
      : of('');

  // ORIGIN stream (now using concatMap)
  const originStream$ = this.retourForm
    .get('origin')!
    .valueChanges.pipe(
      map(v => (v as string).toUpperCase()),
      concatMap((code: string) => {
        const cur = this.originName;
        if (code.length === 2 && this.mapService.departmentMap[code]) {
          return createTyping(this.mapService.departmentMap[code]);
        }
        return createDeleting(cur);
      })
    );

  this.sub.add(
    originStream$.subscribe((txt: string) => (this.originName = txt))
  );

  // DESTINATION stream
  const destStream$ = this.retourForm
    .get('destination')!
    .valueChanges.pipe(
      map(v => (v as string).toUpperCase()),
      concatMap((code: string) => {
        const cur = this.destinationName;
        if (code.length === 2 && this.mapService.departmentMap[code]) {
          return createTyping(this.mapService.departmentMap[code]);
        }
        return createDeleting(cur);
      })
    );

  this.sub.add(
    destStream$.subscribe((txt: string) => (this.destinationName = txt))
  );

  this.sub.add(
      this.propositionForm.get('periode_souhaitee_start')!
        .valueChanges.subscribe(() => {
          this.propositionForm.get('periode_souhaitee_end')!.updateValueAndValidity();
        })
    );
  

}
  ngAfterViewInit(): void {
    // Initialiser le geocoder Nominatim
    this.initNominatimGeocoder();
    // Brancher les inputs d’adresse
    this.hookAddressInputs();
  }
  private initNominatimGeocoder() {
    // Nominatim attend un objet options avec geocodingQueryParams
    this.nominatimGeocoder = new (L.Control as any).Geocoder.Nominatim({
      geocodingQueryParams: {
        countrycodes: 'fr',
        addressdetails: 1,
        limit: 5,
      },
    });
  }

  /**
   * On récupère les <input> et <ul> pour « chargement » et « livraison »,
   * et on branche keyup pour appeler Nominatim et afficher les suggestions.
   */
  private hookAddressInputs() {
    // 1) On récupère les éléments du DOM (n’oubliez pas de mettre les IDs dans le template)
    const chargInput = document.getElementById(
      'adresse_chargement'
    ) as HTMLInputElement;
    const chargSug = document.getElementById(
      'chargement-suggestions'
    ) as HTMLUListElement;

    const livInput = document.getElementById(
      'adresse_livraison'
    ) as HTMLInputElement;
    const livSug = document.getElementById(
      'livraison-suggestions'
    ) as HTMLUListElement;

    // 2) Fonction générique pour afficher et gérer les suggestions
    const showSuggestions = (
      query: string,
      suggestionsEl: HTMLUListElement,
      inputEl: HTMLInputElement,
      mode: 'chargement' | 'livraison'
    ) => {
      suggestionsEl.innerHTML = '';
      if (!query || query.length < 3) {
        return;
      }

      // Appel à Nominatim : geocode(query, callback)
      this.nominatimGeocoder.geocode(query, (results: any[]) => {
        suggestionsEl.innerHTML = '';
        results.forEach((res) => {
          const li = document.createElement('li');
          li.classList.add('list-group-item');
          li.textContent = res.name;
          li.addEventListener('click', () => {
            // 1) remplir l’input et le FormControl
            inputEl.value = res.name;
            if (mode === 'chargement') {
              this.propositionForm
                .get('adresse_chargement')
                ?.setValue(res.name);
            } else {
              this.propositionForm
                .get('adresse_livraison')
                ?.setValue(res.name);
            }
            // 2) vider la liste de suggestions
            suggestionsEl.innerHTML = '';
          });
          suggestionsEl.appendChild(li);
        });
      });
    };

    // 3) On écoute les événements “keyup” sur chaque input
    chargInput.addEventListener('keyup', (ev: KeyboardEvent) => {
      const q = (ev.target as HTMLInputElement).value;
      if (q.length > 2) {
        showSuggestions(q, chargSug, chargInput, 'chargement');
      } else {
        chargSug.innerHTML = '';
      }
    });

    livInput.addEventListener('keyup', (ev: KeyboardEvent) => {
      const q = (ev.target as HTMLInputElement).value;
      if (q.length > 2) {
        showSuggestions(q, livSug, livInput, 'livraison');
      } else {
        livSug.innerHTML = '';
      }
    });
  }



  toggleView() {
    this.isTableView = !this.isTableView;
  }

  private dateNotPastValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;
      if (!val) return null;
      return val < this.todayString
        ? { datePast: true }
        : null;
    };
  }

  private minDateValidator(otherName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const other = this.retourForm?.get(otherName)?.value;
      if (!control.value || !other) return null;
      return control.value < other
        ? { minDate: { requiredMin: other } }
        : null;
    };
  }


  get detourValue(): string {
    return this.retourForm.get('detour')?.value;
  }
  onSubmit(): void {
    
    let route ='';
    if (this.detourValue === 'Oui') {
          this.selectedRegion$.pipe(
        map(regions => regions.map(region => region.id).join(','))
      ).subscribe(routeString => {
       route = routeString;
      });
      console.log('Route:', route);
    }
    if (this.retourForm.invalid) {
      this.retourForm.markAllAsTouched();
      return;
    }
    this.addloading = true;
    

    // assemble payload exactly like your DRF serializer expects:
    const payload = {
      depart_date_start:  this.retourForm.value.depart_date_start,
      depart_date_end:    this.retourForm.value.depart_date_end,
      arrival_date_start: this.retourForm.value.arrival_date_start,
      arrival_date_end:   this.retourForm.value.arrival_date_end,
      volume:             this.retourForm.value.volume,
      type_camion:        this.retourForm.value.typeCamion,
      avec_hayon:         this.retourForm.value.avecHayon =='Oui',
      detour_possible:    this.retourForm.value.detour == 'Oui',
      origin:             this.retourForm.value.origin ,
      destination:        this.retourForm.value.destination,
      itineraire:         route ,
    };
    console.log('Payload:', payload);
    console.log(this.retourForm.value);

   this.retourService.addRetourVide(payload).subscribe({
      next: (retour) => {
        //console.log('Créé:', retour);
        this.addloading= false;
        // TODO: close modal, reset form, show toast…
        this.retourForm.reset();
        document.getElementById('closeModal')?.click();
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Retour vide ajouté avec succès.',
          confirmButtonText: 'OK'
        });
        this.loadRetourVides();
        this.mapService.resetMap('.add-map');
        
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur s\'est produite lors de l\'ajout du retour vide.',
          confirmButtonText: 'OK'
        });
        this.addloading = false;
      }
    });
  }


  private applyConditionalValidators(detour: string) {
    const origin      = this.retourForm.get('origin')!;
    const destination = this.retourForm.get('destination')!;
    const itineraire  = this.retourForm.get('itineraire')!;

    if (detour === 'Oui') {
      // if détour possible → require itinéraire
      itineraire.setValidators([Validators.required]);
      // and clear origin/destination
      origin.clearValidators();
      destination.clearValidators();
    } else {
      // détour non → require origin & destination
      origin.setValidators([
        Validators.required,
        Validators.pattern('^[0-9]{1,2}$')
      ]);
      destination.setValidators([
        Validators.required,
        Validators.pattern('^[0-9]{1,2}$')
      ]);
      // clear itinéraire
      itineraire.clearValidators();
    }

    // re-run validation
    origin.updateValueAndValidity({ onlySelf: true });
    destination.updateValueAndValidity({ onlySelf: true });
    itineraire.updateValueAndValidity({ onlySelf: true });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  updateRoute(){
    this.selectedRegion$.pipe(
      map(regions => regions.map(region => region.id).join(','))
    ).subscribe(routeString => {
      this.retourForm.patchValue({ itineraire: routeString });
    });
  }


 openPropositionModal(retourId: number) {
    this.activeRetourId = retourId;
    this.propositionForm.reset({
      retour: retourId,
      civility: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      volume_propose: null,
      biens: '',
      periode_souhaitee_start: null,
      periode_souhaitee_end: null,
      flexibilite: false,
      adresse_chargement: '',
      etage_chargement: 0,
      passage_chargement: '',
      adresse_livraison: '',
      etage_livraison: 0,
      passage_livraison: ''
    });
    // Affiche le modal via jQuery/Bootstrap
    ($('#propositionModal') as any).modal('show');
  }

  /**
   * Ferme le modal de proposition.
   */
  closePropositionModal() {
    ($('#propositionModal') as any).modal('hide');
  }

  /**
   * Soumet la proposition au backend via PropositionService.
   */
  submitProposition() {
    if (this.propositionForm.invalid) {
      this.propositionForm.markAllAsTouched();
      return;
    }
    this.isSubmittingProp = true;
   
    const payload = this.propositionForm.value;

    this.propositionService.createProposal(payload).subscribe({
      next: (res: Proposition) => {
        this.isSubmittingProp = false;
        this.closePropositionModal();
        Swal.fire({
          icon: 'success',
          title: 'Proposition envoyée',
          text: `Votre proposition (#${res.id}) a été enregistrée.`,
          confirmButtonText: 'OK'
        });
      },
      error: err => {
        console.error('Erreur création proposition', err);
        this.isSubmittingProp = false;
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.error ? JSON.stringify(err.error) : 'Impossible d’envoyer la proposition.',
          confirmButtonText: 'OK'
        });
      }
    });
  }


  loadRetourVides() {
  this.retourService.getAllRetourVide().subscribe(
    (data) => {
      // make a shallow copy and sort by id from largest to smallest
      this.retourVides = [...data].sort((a, b) => b.id - a.id);
      console.log('Retour Vides (sorted):', this.retourVides);
    },
    (error) => {
      console.error('Error fetching retour vides', error);
    }
  );
}

  deleteRetourVide(id: number) {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Vous ne pourrez pas revenir en arrière!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.retourService.deleteRetourVide(id).subscribe(
          () => {
            this.loadRetourVides();
            Swal.fire(
              'Supprimé!',
              'Le retour vide a été supprimé.',
              'success'
            );
          },
          (error) => {
            console.error('Error deleting retour vide', error);
          }
        );
      }
    });
  }
  editRetourVide(id: number) {
    this.retourService.getRetourVide(id).subscribe(
      (data) => {
        this.retourForm.patchValue({
          depart_date_start:  data.depart_date_start,
          depart_date_end:    data.depart_date_end,
          arrival_date_start: data.arrival_date_start,
          arrival_date_end:   data.arrival_date_end,
          volume:             data.volume,
          typeCamion:        data.type_camion,
          avecHayon:         data.avec_hayon ? 'Oui' : 'Non',
          detour:           data.detour_possible ? 'Oui' : 'Non',
          origin:             data.origin || '',
          destination:        data.destination || '',
          itineraire:         data.itineraire || ''
        });
        this.applyConditionalValidators(data.detour_possible ? 'Oui' : 'Non');
      },
      (error) => {
        console.error('Error fetching retour vide', error);
      }
    );
  }
  updateRetourVide(id: number) {
    if (this.retourForm.invalid) {
      this.retourForm.markAllAsTouched();
      return;
    }
    this.addloading = true;

    const payload = {
      depart_date_start:  this.retourForm.value.depart_date_start,
      depart_date_end:    this.retourForm.value.depart_date_end,
      arrival_date_start: this.retourForm.value.arrival_date_start,
      arrival_date_end:   this.retourForm.value.arrival_date_end,
      volume:             this.retourForm.value.volume,
      type_camion:        this.retourForm.value.typeCamion,
      avec_hayon:         this.retourForm.value.avecHayon =='Oui',
      detour_possible:    this.retourForm.value.detour == 'Oui',
      origin:             this.retourForm.value.origin || null,
      destination:        this.retourForm.value.destination || null,
      itineraire:         this.retourForm.value.itineraire || null
    };
    console.log('Payload:', payload);

    this.retourService.updateRetourVide(id, payload).subscribe({
      next: () => {
        this.addloading= false;
        this.retourForm.reset();
        document.getElementById('closeModal')?.click();
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Retour vide mis à jour avec succès.',
          confirmButtonText: 'OK'
        });
        this.loadRetourVides();
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur s\'est produite lors de la mise à jour du retour vide.',
          confirmButtonText: 'OK'
        });
        this.addloading = false;
      }
    });

  }

  
  trackById(_idx: number, item: any) {
    return item.id;
  }
}
