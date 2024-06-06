import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { observableToBeFn } from 'rxjs/internal/testing/TestScheduler';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private http: HttpClient) { }
  private baseUrl = environment.apiUrl;

 
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

  saveAutoMessage(userId : string, message : string) : Observable<any>{
    return this.http.post<any>(`${this.baseUrl}/auto-message/`, {userId,message});
  }

  createPayment(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/create_payment/`, data);
  }

  updatePayment(paymentId: string,conversation_id:string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/update_payment/${paymentId}/${conversation_id}/`,{});
  }

  retrievePayment(paymentId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/retrieve_payment/${paymentId}/`);
  }

  deletePayment(paymentId: string,conversation_id:string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/delete_payment/${paymentId}/${conversation_id}/`);
  }

  save_feedback(data:any):Observable<any>{
    return this.http.post<any>(`${this.baseUrl}/save_feedback/`,data);
  }
  retrieve_feedback(client_id : string, company_id: string) : Observable<any>{
    return this.http.get<any>(`${this.baseUrl}/retrieve_feedback/?client_id=${client_id}&company_id=${company_id}`);
  }
 
}
