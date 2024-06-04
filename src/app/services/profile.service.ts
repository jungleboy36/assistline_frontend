import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:8000/profile'; // Update this URL as per your backend
  profileUpdated = new Subject<void>();
  constructor(private http: HttpClient,) {}

  // Method to get the user profile data
  getUserProfile(uid: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/?uid=${uid}`);
  }

  // Method to update the user profile data
  updateUserProfile(uid: string, updatedData: any): Observable<any> {
    const updateObservable = this.http.put<any>(`${this.apiUrl}/?uid=${uid}`, updatedData);
    // Notify when the profile is updated
    updateObservable.subscribe(() => this.profileUpdated.next());
    return updateObservable;
  }


  retrieve_feedbacks( company_id: string) : Observable<any>{
    return this.http.get<any>(`http://localhost:8000/retrieve_feedback/?company_id=${company_id}`);
  }
  report_feedback(feedback_id : string): Observable<any>{
    return this.http.post<any>(`http://localhost:8000/save_report/`,{feedback_id});
  }
  }

