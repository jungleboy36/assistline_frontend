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
  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.adminService.getCompanies().subscribe(
      response => {
        this.companies = response;
        this.loading = false ;

      },
      error => {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors du chargement des données.',
          confirmButtonText: 'OK'
        });
      }
    );
  }

  toggleAccountEnabled(company: any, event: Event): void {
    const target = event.target as HTMLInputElement;
    const newStatus = target.checked; // Access the checked property safely

    if (company && typeof newStatus === 'boolean') {
        this.adminService.updateCompanyStatus(company.uid, newStatus).subscribe(
            response => {
                company.enabled = newStatus; // Update local state based on the response
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
}
