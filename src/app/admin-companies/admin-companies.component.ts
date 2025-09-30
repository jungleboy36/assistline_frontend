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
 
      // If not, make the API call
      this.adminService.getCompanies().subscribe(
        response => {
          this.companies = response.sort((a : any, b:any) => {
            return new Date(b.date_inscription).getTime() - new Date(a.date_inscription).getTime();
          });
          // Store the response in localStorage
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
  

  toggleAccountEnabled(company: any, event: Event): void {
    const target = event.target as HTMLInputElement;
    const newStatus = target.checked; // Access the checked property safely
    this.selectedUser = company.id; // Update local state based on the response
    if (company && typeof newStatus === 'boolean') {
        this.adminService.updateCompanyStatus(company.id, newStatus).subscribe(
            response => {
                company.enabled = newStatus;
                this.selectedUser= '';
                const companyIndex = this.companies.findIndex(c => c.id === company.id);

                if (companyIndex !== -1) {
                  // Update the companies array
                  this.companies[companyIndex].enabled = newStatus;
        
                  // Update the local storage with the modified companies array
                }               // Update local state based on the response
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
  const fileUrl = company.file?.replace('http://', 'https://');
  const fileName = 'epreuve_' + company.name + '.pdf';

  if (fileUrl) {
    fetch(fileUrl, {
      method: 'GET',
      credentials: 'include' // If authentication/session required
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      return response.blob();
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(error => {
      console.error('Error downloading file:', error);
    });
  } else {
    console.error('File URL not found for company:', company);
  }
}



previewFile(company: any): void {
  const fileUrl = company.file;
  if (fileUrl) {
    window.open(fileUrl, '_blank');
  } else {
    console.error('File URL not found for company:', company);
  }
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
