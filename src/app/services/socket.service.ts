// socket.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as io from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: SocketIOClient.Socket;
  private apiUrl = environment.apiUrl; // Your Django backend URL

  constructor() {
    this.socket = io(this.apiUrl);
  }

  sendMessage(message: string): void {
    this.socket.emit('message', message);
  }

  receiveMessage(): Observable<string> {
    return new Observable<string>(observer => {
      this.socket.on('message', (data: string) => {
        observer.next(data);
      });
    });
  }
}
