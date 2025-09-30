import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OfferListComponent } from './offer-list/offer-list.component';
import { EditOfferComponent } from './edit-offer/edit-offer.component';
import { DemandeListComponent } from './demande-list/demande-list.component';
import { EditDemandeComponent } from './edit-demande/edit-demande.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './services/AuthGuard';
import { ProfileComponent } from './profile/profile.component';
import { AdminCompaniesComponent } from './admin-companies/admin-companies.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { AdminClientsComponent } from './admin-clients/admin-clients.component';
import { DatePipe } from '@angular/common';
import { ProfileDetailsComponent } from './profile-details/profile-details.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { TokenInterceptor } from './tokenInterceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HomeComponent } from './home/home.component';
import { ChatComponent } from './chat/chat.component';
import { PaymentComponent } from './payment/payment.component';
import { ListOffersVisitorComponent } from './list-offers-visitor/list-offers-visitor.component';
import { AvisComponent } from './avis/avis.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { DashboardAdminComponent } from './dashboard-admin/dashboard-admin.component';
import { FranceMapComponent } from './france-map/france-map.component';
import { RetourVideComponent } from './retour-vide/retour-vide.component';
const routes: Routes = [

{path:'offers', component: OfferListComponent , canActivate: [AuthGuard], data: { expectedRole: ['particulier','professionnel'] }},
{path:'retour-vide', component: RetourVideComponent , canActivate: [AuthGuard], data: { expectedRole: ['particulier','professionnel'] }},

  {path:'demandes', component: DemandeListComponent , canActivate: [AuthGuard], data: { expectedRole: ['particulier','professionnel'] }},
  {path:'france-map', component: FranceMapComponent , canActivate: [AuthGuard], data: { expectedRole: ['particulier','professionnel'] }},
  {path:'chat', component: ChatComponent, canActivate: [AuthGuard], data: { expectedRole: ['particulier','professionnel'] }},
  {path:'edit-demande/:id',component:EditDemandeComponent, canActivate: [AuthGuard],data: { expectedRole: ['particulier','professionnel']}},
  {path:'edit-offer/:id',component:EditOfferComponent, canActivate: [AuthGuard],data: { expectedRole: ['particulier','professionnel']}},
  {path:'profile', component:ProfileComponent, canActivate:[AuthGuard] , data: { expectedRole: ['particulier','professionnel']}},
  { path: 'details/:id', component: ProfileDetailsComponent, canActivate:[AuthGuard] , data: { expectedRole: ['particulier','professionnel']} },
  {path:'register',component:RegisterComponent},
  {path:'forbidden',component:ForbiddenComponent},
  {path:'home',component:HomeComponent},
  {path:'login',component:LoginComponent},
  {path:'payment',component:PaymentComponent},
  {path:'verify-email',component:VerifyEmailComponent},
  {path:'reset-password',component:ResetPasswordComponent},
  {path:'visitor-offers',component:ListOffersVisitorComponent},
  {
    path:'admin',
    children :[
  {path :'avis',component: AvisComponent, canActivate: [AuthGuard], data: { expectedRole: 'admin' }},
  {path:'companies',component:AdminCompaniesComponent , canActivate: [AuthGuard], data: { expectedRole: 'admin' }},
  {path:'clients',component:AdminClientsComponent , canActivate: [AuthGuard], data: { expectedRole: 'admin' }},
  {path:'dashboard',component:DashboardAdminComponent,canActivate: [AuthGuard], data: { expectedRole: 'admin' }}

]},
  { path: '**', redirectTo: '/home', pathMatch: 'full' }


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    DatePipe,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
    // Other providers
  ],
})
export class AppRoutingModule { }
