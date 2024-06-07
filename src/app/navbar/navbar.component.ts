import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';
import { Location } from '@angular/common';
import Pusher from 'pusher-js';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: []
})
export class NavbarComponent implements OnInit {
  isLoggedIn$ = this.authService.isLoggedIn$;
  userInfo: any;
  public profileImageUrl: string | null = null;
  notifications: any[] = [];
  messages : any[] = [];
  message : any = {};
  display_name :any;
  email : any;
  constructor(public authService: AuthService,private profileService: ProfileService,private location: Location) {
    this.email = localStorage.getItem('email');
    this.display_name = localStorage.getItem('display_name');
    const storedProfileImageUrl = localStorage.getItem('profileImageUrl');
    if (storedProfileImageUrl) {
      // Use the stored profile image URL
      this.profileImageUrl = storedProfileImageUrl;
    }    
 
    const currentUrl = this.location.path();
    const pusher = new Pusher('1c26d2cd463b15a19666', {
      cluster: 'eu',
    })
    pusher.subscribe(this.authService.getUserId()).bind('new-message',(data:any)=>{
      if(! currentUrl.includes('chat')){
        console.log('data username pusher : ',data.username);
        this.message.username = data.username;
        this.message.time =  JSON.parse(data.time);
        this.getUserPicture(data.userId,this.message);
        this.messages.push(this.message);
      }
    })
   }

  ngOnInit(): void {
    // Retrieve user info from local storage
    this.authService.infoUser = this.authService.getInfoFromToken();
    console.log('get info from token : ', this.authService.getInfoFromToken());
  
    // Check if profile image URL is available in local storage
    const storedProfileImageUrl = localStorage.getItem('profileImageUrl');
    if (storedProfileImageUrl) {
      // Use the stored profile image URL
      this.profileImageUrl = storedProfileImageUrl;
      console.log("got image from localstorage")
    
    }
  
    this.profileService.profileUpdated.subscribe(() => {
      // Reload data or take necessary actions
      this.loadData();
    });
    this.loadNotifications();
  }
  

  handleLogout(): void {
      this.authService.logout();
  }

  loadData() : void {
    const uid = this.authService.getUserId();
      this.profileService.getUserProfile(uid!).subscribe(
        data => {
          // Set the profile image URL
          this.profileImageUrl = data.image;
        },
        error => {
          console.error('Error fetching user profile', error);
        }
      );

  }

  loadNotifications() {
    // Get the user ID from the authenticated user
    const userId = this.authService.getUserId();
  
    // Call the getNotifications function from the AdminService
    this.authService.getNotifications(userId).subscribe(
      (data: any[]) => {
        // Assign the notifications data to the notifications array
        this.notifications = data;
      },
      (error) => {
        // Handle any errors
        console.error('Error fetching notifications:', error);
      }
    );
  }
  
  markAllAsRead() {
    const userId = this.authService.getUserId();
    this.authService.markAllNotificationsAsRead(userId).subscribe(
      () => {
        // After marking all notifications as read, reload the notifications
        this.notifications = []
      },
      (error: any) => {
        console.error('Error marking all notifications as read:', error);
      }
    );
  }

  getUserPicture(userId: string,message : any) : void {
    this.profileService.getUserProfile(userId!).subscribe(
      data => {
        // Set the profile image URL
        message.image = data.image;
      },
      error => {
        console.error('Error fetching user profile', error);
      }
    );
  }

  clearAllMessages(){
    this.messages = [];
  }
}