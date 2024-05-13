import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private http: HttpClient) { }
  private baseUrl = 'http://localhost:8000';

 
  getConversations(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/conversations/${userId}/`);
  }

  getMessages(conversationId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/messages/${conversationId}/`);
  }

  sendMessage(messageData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/send/`, messageData);
  }

  getUserProfile(uid: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/profile/?uid=${uid}`);
  }

  createConversation(receiver_id : string, sender_id : string,receiver_display_name:string,sender_display_name :string): Observable<any>{
    return this.http.post<any>(`${this.baseUrl}/create-conversation/`, {receiver_id,sender_id,receiver_display_name,sender_display_name});

  }
}
