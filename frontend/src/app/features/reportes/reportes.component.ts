import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidenciasService } from '../../core/services/incidencias.service';
import { DispositivosService } from '../../core/services/dispositivos.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent implements OnInit {
  statsIncidencias = signal<any>(null);
  statsDispositivos = signal<any>(null);
  cargando = signal(true);

  constructor(
    private incidenciasService: IncidenciasService,
    private dispositivosService: DispositivosService
  ) {}

  ngOnInit(): void {
    this.incidenciasService.estadisticas().subscribe({ next: s => this.statsIncidencias.set(s), error: () => {} });
    this.dispositivosService.estadisticas().subscribe({
      next: s => { this.statsDispositivos.set(s); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  uptimePorcentaje(): number {
    const s = this.statsDispositivos();
    if (!s || s.total === 0) return 0;
    return Math.round((s.activos / s.total) * 100);
  }

  tasaResolucion(): number {
    const s = this.statsIncidencias();
    if (!s || s.total === 0) return 0;
    return Math.round((s.resueltas / s.total) * 100);
  }
}
