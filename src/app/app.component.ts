import { Component, HostListener } from '@angular/core';
import { AuthService } from './services/auth.service';
import { PresenceService } from './services/presence.service';
import * as jQuery from 'jquery';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private authService: AuthService, private presenceService: PresenceService) {
    this.updateUserStatus(true);
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: Event) {
    this.updateUserStatus(false);
  }

  updateUserStatus(status: boolean) {
 
  }
}
