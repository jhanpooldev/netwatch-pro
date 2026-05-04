import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidenciasService } from '../../core/services/incidencias.service';
import { DispositivosService } from '../../core/services/dispositivos.service';
import { Incidencia } from '../../core/models/incidencia.model';
import { Dispositivo } from '../../core/models/dispositivo.model';

@Component({
  selector: 'app-incidencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidencias.component.html',
  styleUrl: './incidencias.component.scss'
})
export class IncidenciasComponent implements OnInit {
  incidencias = signal<Incidencia[]>([]);
  dispositivos = signal<Dispositivo[]>([]);
  total = signal(0);
  cargando = signal(true);
  mostrarModal = signal(false);
  modoEdicion = signal(false);
  mensajeExito = signal('');
  mensajeError = signal('');
  filtroEstado = '';
  filtroPrioridad = '';
  paginaActual = 1;
  limit = 10;
  incidenciaEditandoId = '';

  form: Partial<Incidencia> & { comentario?: string } = this.formVacio();

  constructor(
    private incidenciasService: IncidenciasService,
    private dispositivosService: DispositivosService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.dispositivosService.listar().subscribe({ next: d => this.dispositivos.set(d), error: () => {} });
  }

  cargar(): void {
    this.cargando.set(true);
    const filtros = {
      estado: this.filtroEstado,
      prioridad: this.filtroPrioridad,
      page: this.paginaActual,
      limit: this.limit
    };
    this.incidenciasService.listar(filtros).subscribe({
      next: res => { this.incidencias.set(res.datos); this.total.set(res.total); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  formVacio(): Partial<Incidencia> & { comentario?: string } {
    return { titulo: '', descripcion: '', prioridad: 'media', estado: 'abierta', dispositivo_id: '', comentario: '' };
  }

  abrirNuevo(): void { this.form = this.formVacio(); this.modoEdicion.set(false); this.mostrarModal.set(true); }

  abrirEditar(i: Incidencia): void {
    this.form = { ...i, dispositivo_id: i.dispositivo_id?._id || i.dispositivo_id, tecnico_id: i.tecnico_id?._id || i.tecnico_id, comentario: '' };
    this.incidenciaEditandoId = i._id;
    this.modoEdicion.set(true);
    this.mostrarModal.set(true);
  }

  cerrarModal(): void { this.mostrarModal.set(false); this.mensajeError.set(''); }

  guardar(): void {
    if (!this.form.titulo || !this.form.descripcion) {
      this.mensajeError.set('Título y descripción son requeridos.');
      return;
    }
    const obs = this.modoEdicion()
      ? this.incidenciasService.actualizar(this.incidenciaEditandoId, this.form)
      : this.incidenciasService.crear(this.form);

    obs.subscribe({
      next: () => {
        this.mensajeExito.set(this.modoEdicion() ? 'Incidencia actualizada.' : 'Incidencia creada.');
        this.cerrarModal();
        this.cargar();
        setTimeout(() => this.mensajeExito.set(''), 3000);
      },
      error: err => this.mensajeError.set(err?.error?.mensaje || 'Error al guardar.')
    });
  }

  eliminar(id: string): void {
    if (!confirm('¿Eliminar esta incidencia?')) return;
    this.incidenciasService.eliminar(id).subscribe({
      next: () => { this.mensajeExito.set('Incidencia eliminada.'); this.cargar(); setTimeout(() => this.mensajeExito.set(''), 3000); },
      error: () => {}
    });
  }

  get totalPaginas(): number { return Math.ceil(this.total() / this.limit); }

  paginaAnterior(): void { if (this.paginaActual > 1) { this.paginaActual--; this.cargar(); } }
  paginaSiguiente(): void { if (this.paginaActual < this.totalPaginas) { this.paginaActual++; this.cargar(); } }

  etiquetaPrioridad(p: string): string {
    return ({ baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica' } as any)[p] || p;
  }

  etiquetaEstado(e: string): string {
    return ({ abierta: 'Abierta', en_progreso: 'En Progreso', resuelta: 'Resuelta', cerrada: 'Cerrada' } as any)[e] || e;
  }
}
