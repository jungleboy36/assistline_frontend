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
const routes: Routes = [

{path:'offers',
children :[
  {path:'', component: OfferListComponent , canActivate: [AuthGuard], data: { expectedRole: 'client' }},
]
},

  {path:'demandes', component: DemandeListComponent , canActivate: [AuthGuard]},
  {path:'edit-demande/:id',component:EditDemandeComponent, canActivate: [AuthGuard]},
  {path:'edit-offer/:id',component:EditOfferComponent, canActivate: [AuthGuard]},
  {path:'profile', component:ProfileComponent, canActivate:[AuthGuard] },
  {path:'register',component:RegisterComponent},
  {path:'forbidden',component:ForbiddenComponent},
  {path:'login',component:LoginComponent},
  {
    path:'admin',
    children :[
  {path:'companies',component:AdminCompaniesComponent , canActivate: [AuthGuard], data: { expectedRole: 'admin' }},
  {path:'clients',component:AdminClientsComponent , canActivate: [AuthGuard], data: { expectedRole: 'admin' }},

]},
  { path: '**', redirectTo: '/login', pathMatch: 'full' } // Redirect to '/offers' for unmatched routes

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
