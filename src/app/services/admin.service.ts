import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = environment.apiUrl +'/ad-api';  // Update with your backend URL

  constructor(private http: HttpClient) {}

  getCompanies(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/companies`);
  }

  updateCompanyStatus(uid: string, enabled: boolean): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/companies/${uid}/`, { enabled });
  }

  downloadFile(uid: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/companies/${uid}/download-file/`);
  }

  getClients(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/clients`);
  }

  updateClientStatus(uid: string, enabled: boolean): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/clients/${uid}/`, { enabled });
  }

  getNotifications(userId: string): Observable<any> {
    return this.http.get<any>(`http://localhost:8000/notifications/?user_id=${userId}`);
  }
  markAllNotificationsAsRead(userId : string): Observable<any> {
    return this.http.post<any>(`http://localhost:8000/notifications/mark-all-as-read/?user_id=${userId}`, {});
  }
}
