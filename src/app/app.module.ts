import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
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
    
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    
    
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
