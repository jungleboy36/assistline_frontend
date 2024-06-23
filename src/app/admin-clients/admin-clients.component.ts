import { Component, OnInit } from '@angular/core';
import { AdminService } from '../services/admin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-clients',
  templateUrl: './admin-clients.component.html',
  styleUrls: []
})
export class AdminClientsComponent implements OnInit {
  clients: any[] = [];
  loading = true;
  selectedUser : string = '';
  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadClients();
  }

  // Load the list of clients from the AdminService
  loadClients(): void {
    const cachedClients = localStorage.getItem('clients');
    
    if (cachedClients) {
      // If clients are found in localStorage, parse and set them
      this.clients = JSON.parse(cachedClients);
      this.loading = false;
    } 
      // If not, make the API call
      this.adminService.getClients().subscribe({
        next: (response) => {
          this.clients = response;
          // Store the response in localStorage
          localStorage.setItem('clients', JSON.stringify(this.clients));
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading clients:', err);
          this.loading = false;
        }
      });
    
  }
  

  // Update the status of a client
  updateClientStatus(client: any, event: Event): void {
    const target = event.target as HTMLInputElement;
    const newStatus = target.checked; // Access the checked property safely
    this.selectedUser = client.uid; // Update local state based on the response

    if (client && typeof newStatus === 'boolean') {
        this.adminService.updateClientStatus(client.uid, newStatus).subscribe(
            response => {
                client.enabled = newStatus;
                this.selectedUser = ''; 
                const clientIndex = this.clients.findIndex(c => c.uid === client.uid);

                if (clientIndex !== -1) {
                  // Update the companies array
                  this.clients[clientIndex].enabled = newStatus;
        
                  // Update the local storage with the modified companies array
                  localStorage.setItem('clients', JSON.stringify(this.clients));
                }  
                //this.loadClients();
                // Update local state based on the response
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

  // Download a file associated with a client

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