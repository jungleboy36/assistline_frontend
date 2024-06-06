import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
    private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  getDocumentCount(): Observable<any> {
    return this.http.get<any>(this.apiUrl+'/stats');
  }
}