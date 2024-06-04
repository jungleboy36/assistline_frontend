import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AvisService {
  private baseUrl = 'http://localhost:8000';
  constructor(private http : HttpClient) {
    

    
   }

   getReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get_reports/`);
  }

  deleteReport(feedback_id: string): Observable<any[]> {
    return this.http.delete<any[]>(`${this.baseUrl}/delete_report/${feedback_id}`);
  }
}
