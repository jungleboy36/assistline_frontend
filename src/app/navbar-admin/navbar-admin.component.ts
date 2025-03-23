import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-navbar-admin',
  templateUrl: './navbar-admin.component.html',
  styleUrls: []
})
export class NavbarAdminComponent {
  notifications: any[] = []; 
  constructor(public authService: AuthService, private adminService : AdminService){}


ngOnInit(): void {
  // Call the getNotifications function when the component initializes
  this.loadNotifications();
}

loadNotifications() {
  // Get the user ID from the authenticated user
  const userId = this.authService.getUserId();

  // Call the getNotifications function from the AdminService
  
}

markAllAsRead() {

}
}