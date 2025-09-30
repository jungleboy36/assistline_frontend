import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RetourVideService {
  private apiUrl = environment.apiUrl+'/retour-vide/';
  constructor(private http: HttpClient) { }


  addRetourVide(payload: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload,{withCredentials: true});
  }
    /** READ all */
    getAllRetourVide(): Observable<any[]> {
      return this.http.get<any[]>(
        this.apiUrl,
        { withCredentials: true }
      );
    }
  
    /** READ one by id */
    getRetourVide(id: number): Observable<any> {
      return this.http.get<any>(
        `${this.apiUrl}${id}/`,
        { withCredentials: true }
      );
    }
  
    /** UPDATE (partial) */
    updateRetourVide(id: number, payload: Partial<any>): Observable<any> {
      return this.http.patch<any>(
        `${this.apiUrl}${id}/`,
        payload,
        { withCredentials: true }
      );
    }
  
    /** DELETE */
    deleteRetourVide(id: number): Observable<void> {
      return this.http.delete<void>(
        `${this.apiUrl}${id}/`,
        { withCredentials: true }
      );
    }
}
