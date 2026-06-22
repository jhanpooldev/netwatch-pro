import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IncidenciasService } from '../../core/services/incidencias.service';
import { DispositivosService } from '../../core/services/dispositivos.service';
import { Incidencia } from '../../core/models/incidencia.model';
import { Dispositivo } from '../../core/models/dispositivo.model';

@Component({
  selector: 'app-incidencias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './incidencias.component.html',
  styleUrl: './incidencias.component.scss'
})
export class IncidenciasComponent implements OnInit {
  incidencias  = signal<Incidencia[]>([]);
  dispositivos = signal<Dispositivo[]>([]);
  total        = signal(0);
  cargando     = signal(true);
  mostrarModal = signal(false);
  modoEdicion  = signal(false);
  mensajeExito = signal('');
  mensajeError = signal('');

  filtroEstado    = '';
  filtroPrioridad = '';
  paginaActual    = 1;
  limit           = 10;
  incidenciaEditandoId = '';

  form!: FormGroup;

  constructor(
    private incidenciasService: IncidenciasService,
    private dispositivosService: DispositivosService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarForm();
    this.cargar();
    this.dispositivosService.listar().subscribe({ next: d => this.dispositivos.set(d), error: () => {} });
  }

  inicializarForm(data?: Partial<Incidencia> & { comentario?: string }): void {
    this.form = this.fb.group({
      titulo:        [data?.titulo       ?? '', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      descripcion:   [data?.descripcion  ?? '', [Validators.required, Validators.minLength(10)]],
      dispositivo_id:[data?.dispositivo_id ?? ''],
      prioridad:     [data?.prioridad    ?? 'media', Validators.required],
      estado:        [data?.estado       ?? 'abierta'],
      comentario:    [data?.comentario   ?? '']
    });
  }

  // Getters de conveniencia para el template
  get f() { return this.form.controls; }
  get tituloInvalido()      { return this.f['titulo'].invalid      && this.f['titulo'].touched; }
  get descripcionInvalida() { return this.f['descripcion'].invalid && this.f['descripcion'].touched; }

  cargar(): void {
    this.cargando.set(true);
    const filtros = {
      estado:    this.filtroEstado,
      prioridad: this.filtroPrioridad,
      page:      this.paginaActual,
      limit:     this.limit
    };
    this.incidenciasService.listar(filtros).subscribe({
      next: res => { this.incidencias.set(res.datos); this.total.set(res.total); this.cargando.set(false); },
      error: ()  => this.cargando.set(false)
    });
  }

  abrirNuevo(): void {
    this.inicializarForm();
    this.modoEdicion.set(false);
    this.mostrarModal.set(true);
  }

  abrirEditar(i: Incidencia): void {
    this.inicializarForm({
      ...i,
      dispositivo_id: (i.dispositivo_id as any)?._id || i.dispositivo_id,
      comentario: ''
    });
    this.incidenciaEditandoId = i._id;
    this.modoEdicion.set(true);
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.mensajeError.set('');
    this.form.reset();
  }

  guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.mensajeError.set('Corrige los errores del formulario antes de continuar.');
      return;
    }

    const payload = this.form.getRawValue();
    const obs = this.modoEdicion()
      ? this.incidenciasService.actualizar(this.incidenciaEditandoId, payload)
      : this.incidenciasService.crear(payload);

    obs.subscribe({
      next: () => {
        this.mensajeExito.set(this.modoEdicion() ? 'Incidencia actualizada.' : 'Incidencia creada.');
        this.cerrarModal();
        this.cargar();
        setTimeout(() => this.mensajeExito.set(''), 3000);
      },
      error: err => this.mensajeError.set(err?.error?.detail || 'Error al guardar.')
    });
  }

  eliminar(id: string): void {
    if (!confirm('¿Eliminar esta incidencia?')) return;
    this.incidenciasService.eliminar(id).subscribe({
      next: () => { this.mensajeExito.set('Incidencia eliminada.'); this.cargar(); setTimeout(() => this.mensajeExito.set(''), 3000); },
      error: () => {}
    });
  }

  filtrarEstado(valor: string): void   { this.filtroEstado    = valor; this.paginaActual = 1; this.cargar(); }
  filtrarPrioridad(valor: string): void { this.filtroPrioridad = valor; this.paginaActual = 1; this.cargar(); }

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
