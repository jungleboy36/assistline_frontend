import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar-admin',
  templateUrl: './navbar-admin.component.html',
  styleUrls: []
})
export class NavbarAdminComponent {

  constructor(public authService: AuthService){}
}
