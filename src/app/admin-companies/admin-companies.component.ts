import { Component } from '@angular/core';
import { AdminService } from '../services/admin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-companies',
  templateUrl: './admin-companies.component.html',
  styleUrls: []
})
export class AdminCompaniesComponent {
  companies: any[] = [];
  loading : boolean = true ; 
  selectedUser : string = '';
  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    
    this.loadCompanies();
  }

  loadCompanies(): void {
    const cachedCompanies = localStorage.getItem('companies');
    
    if (cachedCompanies) {
      // If companies are found in localStorage, parse and set them
      this.companies = JSON.parse(cachedCompanies);
      this.loading = false;
    } else {
      // If not, make the API call
      this.adminService.getCompanies().subscribe(
        response => {
          this.companies = response;
          // Store the response in localStorage
          localStorage.setItem('companies', JSON.stringify(this.companies));
          this.loading = false;
        },
        error => {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Erreur lors du chargement des données.',
            confirmButtonText: 'OK'
          });
          this.loading = false;
        }
      );
    }
  }
  

  toggleAccountEnabled(company: any, event: Event): void {
    const target = event.target as HTMLInputElement;
    const newStatus = target.checked; // Access the checked property safely
    this.selectedUser = company.uid; // Update local state based on the response
    if (company && typeof newStatus === 'boolean') {
        this.adminService.updateCompanyStatus(company.uid, newStatus).subscribe(
            response => {
                company.enabled = newStatus;
                this.selectedUser= '';
                this.loadCompanies();                // Update local state based on the response
                /* Swal.fire({
                    icon: 'success',
                    title: 'Mise à jour réussie',
                    text: 'Le statut du compte a été mis à jour avec succès.',
                    confirmButtonText: 'OK'
                }); */
            },
            error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: 'Erreur lors de la mise à jour du statut.',
                    confirmButtonText: 'OK'
                });
            }
        );
    }
}



  downloadFile(company: any): void {
    this.adminService.downloadFile(company.uid).subscribe(
      response => {
        const fileUrl = response.file_url;
        // Use file URL to download the file
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = 'epreuve '+ company.name;
        link.click();
      },
      error => {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors du téléchargement du fichier.',
          confirmButtonText: 'OK'
        });
      }
    );
  }

  isNew(dateInscription: string): boolean {
    const currentDate = new Date();
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);
  
    // Parse the dateInscription string into a Date object
    const parsedDate = new Date(dateInscription);
  
    // Normalize the dates to remove time component for comparison
    const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
    const normalizedDate = normalizeDate(parsedDate);
    const normalizedCurrentDate = normalizeDate(currentDate);
    const normalizedTomorrow = normalizeDate(tomorrow);
  
    return normalizedDate.getTime() === normalizedCurrentDate.getTime() || 
           normalizedDate.getTime() === normalizedTomorrow.getTime();
  }
}
