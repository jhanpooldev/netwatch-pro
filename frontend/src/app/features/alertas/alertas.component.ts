import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertasService } from '../../core/services/alertas.service';
import { SocketService } from '../../core/services/socket.service';
import { Alerta } from '../../core/models/alerta.model';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alertas.component.html',
  styleUrl: './alertas.component.scss'
})
export class AlertasComponent implements OnInit, OnDestroy {
  alertas = signal<Alerta[]>([]);
  total = signal(0);
  cargando = signal(true);
  filtroNivel = '';
  filtroReconocida = '';
  mensajeExito = signal('');

  constructor(
    private alertasService: AlertasService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.socketService.conectar();
    this.socketService.escuchar<Alerta>('nueva_alerta', alerta => {
      this.alertas.update(a => [alerta, ...a]);
      this.total.update(t => t + 1);
    });
    this.socketService.escuchar<{ id: string }>('alerta_reconocida', data => {
      this.alertas.update(a => a.map(al => al._id === data.id ? { ...al, reconocida: true } : al));
    });
  }

  ngOnDestroy(): void {
    this.socketService.dejarDeEscuchar('nueva_alerta');
    this.socketService.dejarDeEscuchar('alerta_reconocida');
  }

  cargar(): void {
    this.cargando.set(true);
    const filtros: any = { nivel: this.filtroNivel };
    if (this.filtroReconocida !== '') filtros.reconocida = this.filtroReconocida;
    this.alertasService.listar(filtros).subscribe({
      next: r => { this.alertas.set(r.datos); this.total.set(r.total); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  reconocer(id: string): void {
    this.alertasService.reconocer(id).subscribe({
      next: () => {
        this.alertas.update(a => a.map(al => al._id === id ? { ...al, reconocida: true } : al));
        this.mensajeExito.set('Alerta reconocida correctamente.');
        setTimeout(() => this.mensajeExito.set(''), 3000);
      }
    });
  }

  etiquetaNivel(n: string): string {
    return ({ informacion: 'INFO', advertencia: 'WARN', alto: 'ALTO', critico: 'CRÍTICO' } as any)[n] || n;
  }

  etiquetaTipo(t: string): string {
    return ({ caida: 'Caída', latencia_alta: 'Latencia Alta', perdida_paquetes: 'Pérd. Paquetes', recuperacion: 'Recuperación' } as any)[t] || t;
  }

  tiempoTranscurrido(fecha: Date): string {
    const diff = Date.now() - new Date(fecha).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Ahora';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h}h`;
    return `hace ${Math.floor(h / 24)}d`;
  }
}
