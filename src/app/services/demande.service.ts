

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DemandeService {
  private apiUrl = environment.apiUrl+ '/demandes';

  constructor(private http: HttpClient) { }

  getDemandes(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl+'/');
  }
  getDemandesById(id : string): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl+'/?user_id='+id);
  }
  addDemande(demandeData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl+'/', demandeData)
        .pipe(
            catchError(this.handleError)
        );
}

  deleteDemande(id: string): Observable<any> {
    const url = `${this.apiUrl}/${id}/`;
    return this.http.delete<any>(url);
  }

  updateDemande(demandeId: string, updatedDemande: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${demandeId}/`, updatedDemande);
  }

  getDemandeById(demandeId: string): Observable<any> {
    const url = `${this.apiUrl}/${demandeId}/`;
    return this.http.get<any>(url);
  }

  private handleError(error: any) {
    console.error('API Error:', error);
    return throwError('An error occurred. Please try again later.');
}

getMinDate(): string {
  // Calculate the minimum date (e.g., today's date)
  const today = new Date();
  const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Adding 1 because getMonth() returns zero-based month
  const day = today.getDate().toString().padStart(2, '0');
  const year = today.getFullYear();

  // Format the minimum date string in a way that datetime-local input expects
  return `${year}-${month}-${day}`;
}

}
