import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DispositivosService } from '../../core/services/dispositivos.service';
import { IncidenciasService } from '../../core/services/incidencias.service';
import { AlertasService } from '../../core/services/alertas.service';
import { SocketService } from '../../core/services/socket.service';
import { Dispositivo, EstadisticasDispositivos } from '../../core/models/dispositivo.model';
import { EstadisticasIncidencias } from '../../core/models/incidencia.model';
import { Alerta } from '../../core/models/alerta.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  dispositivos = signal<Dispositivo[]>([]);
  statsDispositivos = signal<EstadisticasDispositivos>({ total: 0, activos: 0, inactivos: 0, degradados: 0 });
  statsIncidencias = signal<EstadisticasIncidencias>({ total: 0, abiertas: 0, en_progreso: 0, resueltas: 0, criticas: 0 });
  alertasRecientes = signal<Alerta[]>([]);
  cargando = signal(true);

  constructor(
    private dispositivosService: DispositivosService,
    private incidenciasService: IncidenciasService,
    private alertasService: AlertasService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
    this.socketService.conectar();
    this.socketService.escuchar<any>('dispositivo_estado', (data) => {
      this.dispositivos.update(devs =>
        devs.map(d => d._id === data.id ? { ...d, estado: data.estado, latencia_actual: data.latencia, ultima_verificacion: data.ultima_verificacion } : d)
      );
    });
    this.socketService.escuchar<Alerta>('nueva_alerta', (alerta) => {
      this.alertasRecientes.update(a => [alerta, ...a].slice(0, 5));
    });
  }

  ngOnDestroy(): void {
    this.socketService.dejarDeEscuchar('dispositivo_estado');
    this.socketService.dejarDeEscuchar('nueva_alerta');
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.dispositivosService.listar().subscribe({ next: devs => this.dispositivos.set(devs), error: () => {} });
    this.dispositivosService.estadisticas().subscribe({ next: s => this.statsDispositivos.set(s), error: () => {} });
    this.incidenciasService.estadisticas().subscribe({ next: s => { this.statsIncidencias.set(s); this.cargando.set(false); }, error: () => this.cargando.set(false) });
    this.alertasService.listar({ limit: 5 }).subscribe({ next: r => this.alertasRecientes.set(r.datos), error: () => {} });
  }

  etiquetaEstado(estado: string): string {
    const map: any = { activo: 'Activo', inactivo: 'Inactivo', degradado: 'Degradado', sin_monitoreo: 'Sin Monitoreo' };
    return map[estado] || estado;
  }

  etiquetaTipo(tipo: string): string {
    const map: any = { router: '⊕', switch: '⊞', servidor: '▣', workstation: '⊡', impresora: '⊟', otro: '◈' };
    return map[tipo] || '◈';
  }

  etiquetaNivelAlerta(nivel: string): string {
    const map: any = { informacion: 'INFO', advertencia: 'WARN', alto: 'HIGH', critico: 'CRIT' };
    return map[nivel] || nivel;
  }

  tiempoTranscurrido(fecha: Date | null): string {
    if (!fecha) return 'Nunca';
    const diff = Date.now() - new Date(fecha).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Ahora';
    if (min < 60) return `hace ${min}m`;
    const h = Math.floor(min / 60);
    return `hace ${h}h`;
  }
}
