import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpClientXsrfModule ,HttpClientJsonpModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OfferListComponent } from './offer-list/offer-list.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavbarComponent } from './navbar/navbar.component';
import { EditOfferComponent } from './edit-offer/edit-offer.component';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { CreationDatePipe } from './creation-date.pipe';
import { UpdateDurationPipe } from './update-duration.pipe';
import { ReactiveFormsModule } from '@angular/forms';
import { DemandeListComponent } from './demande-list/demande-list.component';
import { EditDemandeComponent } from './edit-demande/edit-demande.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { AdminCompaniesComponent } from './admin-companies/admin-companies.component';
import { SidebarAdminComponent } from './sidebar-admin/sidebar-admin.component';
import { NavbarAdminComponent } from './navbar-admin/navbar-admin.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { AdminClientsComponent } from './admin-clients/admin-clients.component';
import { ProfileDetailsComponent } from './profile-details/profile-details.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { environment } from '../environments/environment';
import { ChatComponent } from './chat/chat.component';
import { HomeComponent } from './home/home.component';
import { PaymentComponent } from './payment/payment.component';
import { ListOffersVisitorComponent } from './list-offers-visitor/list-offers-visitor.component';
import { AvisComponent } from './avis/avis.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { DashboardAdminComponent } from './dashboard-admin/dashboard-admin.component';
import { FranceMapComponent } from './france-map/france-map.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RetourVideComponent } from './retour-vide/retour-vide.component';

const firebaseConfig = environment.firebaseConfig;
@NgModule({
  declarations: [
    AppComponent,
    OfferListComponent,
    SidebarComponent,
    NavbarComponent,
    EditOfferComponent,
    CreationDatePipe,
    UpdateDurationPipe,
    DemandeListComponent,
    EditDemandeComponent,
    RegisterComponent,
    LoginComponent,
    ProfileComponent,
    AdminCompaniesComponent,
    SidebarAdminComponent,
    NavbarAdminComponent,
    ForbiddenComponent,
    AdminClientsComponent,
    ProfileDetailsComponent,
    VerifyEmailComponent,
    ChatComponent,
    HomeComponent,
    PaymentComponent,
    ListOffersVisitorComponent,
    AvisComponent,
    ResetPasswordComponent,
    DashboardAdminComponent,
    FranceMapComponent,
    RetourVideComponent,
    
   
    
    
  ],
  
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
      HttpClientJsonpModule  ,
    HttpClientXsrfModule.withOptions({
      cookieName: 'csrftoken',
      headerName: 'X-CSRFToken'
    }),
    FormsModule,
    ReactiveFormsModule,
    AngularFireModule,
    AngularFireAuthModule,
 
     BrowserAnimationsModule,

    AngularFireModule.initializeApp(environment.firebaseConfig)

    
    
    
  ],
  providers: [    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
