import { AfterViewInit, Component } from '@angular/core';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: []
})
export class SidebarComponent implements AfterViewInit {

  constructor(private authService : AuthService){}
  ngAfterViewInit(): void {
    const win = window as any;
    if (typeof win.initializeSidebar === 'function') {
      win.initializeSidebar();
    } else {
      console.error('initializeSidebar function not found');
    }
  }
}
