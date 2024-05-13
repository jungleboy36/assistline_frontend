// presence.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
    private apiUrl = 'http://127.0.0.1:8000/' 

  constructor(private http: HttpClient) { }

  updateUserPresence(onlineStatus: boolean,userId :string): Observable<any> {
    // Make a POST request to the Django endpoint to update user presence
    return this.http.post<any>(`${this.apiUrl}update-user-presence/`, { online: onlineStatus, userId: userId });
  }

  getUserPresence(userId: string): Observable<{ online: boolean }> {
    return this.http.get<{ online: boolean }>(`${this.apiUrl}get-user-presence/?userId=${userId}`);
  }
}
