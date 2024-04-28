// offer.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  private apiUrl = 'http://127.0.0.1:8000/offres';

  constructor(private http: HttpClient) { }

  getOffers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl+'/');
  }

  getOffersById(user_id : string): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl+'/?user_id=' + user_id);
  }
  addOffer(offerData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl+'/', offerData)
        .pipe(
            catchError(this.handleError)
        );
}

  deleteOffer(id: string): Observable<any> {
    const url = `${this.apiUrl}/${id}/`;
    return this.http.delete<any>(url);
  }

  updateOffer(offerId: string, updatedOffer: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${offerId}/`, updatedOffer);
  }

  getOfferById(offerId: string): Observable<any> {
    const url = `${this.apiUrl}/${offerId}/`;
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
  return `${year}-${month}-${day}T00:00`;
}
}
