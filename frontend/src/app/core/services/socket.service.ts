import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;
  conectado = signal(false);

  constructor() {
    this.socket = io(environment.wsUrl, { autoConnect: false });
    this.socket.on('connect', () => this.conectado.set(true));
    this.socket.on('disconnect', () => this.conectado.set(false));
  }

  conectar(): void {
    if (!this.socket.connected) this.socket.connect();
  }

  desconectar(): void {
    this.socket.disconnect();
  }

  escuchar<T>(evento: string, callback: (data: T) => void): void {
    this.socket.on(evento, callback);
  }

  dejarDeEscuchar(evento: string): void {
    this.socket.off(evento);
  }
}
