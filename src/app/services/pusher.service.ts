import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PusherAuthService {
  constructor(private http: HttpClient) {}

  authenticatePusher(channelName: string, socketId: string) {
    return this.http.post<any>('http://localhost:8000/pusher/auth/', {
      channel_name: channelName,
      socket_id: socketId
    });
  }
}
