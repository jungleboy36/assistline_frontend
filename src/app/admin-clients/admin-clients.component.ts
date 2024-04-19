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

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadClients();
  }

  // Load the list of clients from the AdminService
  loadClients(): void {
    this.adminService.getClients().subscribe({
      next: (response) => {
        this.clients = response;
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

    if (client && typeof newStatus === 'boolean') {
        this.adminService.updateClientStatus(client.uid, newStatus).subscribe(
            response => {
                client.enabled = newStatus; // Update local state based on the response
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
}