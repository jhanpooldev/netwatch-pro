import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DispositivosService } from '../../core/services/dispositivos.service';
import { Dispositivo } from '../../core/models/dispositivo.model';

@Component({
  selector: 'app-dispositivos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dispositivos.component.html',
  styleUrl: './dispositivos.component.scss'
})
export class DispositivosComponent implements OnInit {
  dispositivos = signal<Dispositivo[]>([]);
  cargando      = signal(true);
  mostrarModal  = signal(false);
  modoEdicion   = signal(false);
  mensajeExito  = signal('');
  mensajeError  = signal('');

  form!: FormGroup;
  dispositivoEditandoId = '';

  constructor(
    private dispositivosService: DispositivosService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarForm();
    this.cargar();
  }

  inicializarForm(data?: Partial<Dispositivo>): void {
    this.form = this.fb.group({
      nombre:        [data?.nombre       ?? '', [Validators.required, Validators.minLength(2)]],
      ip_address:    [data?.ip_address   ?? '', [Validators.required,
                       Validators.pattern(/^(\d{1,3}\.){3}\d{1,3}$|^[\w.-]+\.[a-z]{2,}$/i)]],
      mac_address:   [data?.mac_address  ?? ''],
      tipo:          [data?.tipo         ?? 'otro'],
      ubicacion:     [data?.ubicacion    ?? ''],
      intervalo_ping:[data?.intervalo_ping ?? 60, [Validators.min(5), Validators.max(3600)]],
      estado:        [data?.estado       ?? 'sin_monitoreo']
    });
  }

  // Getters de conveniencia para el template
  get f() { return this.form.controls; }
  get nombreInvalido()     { return this.f['nombre'].invalid     && this.f['nombre'].touched; }
  get ipInvalida()         { return this.f['ip_address'].invalid && this.f['ip_address'].touched; }
  get intervaloInvalido()  { return this.f['intervalo_ping'].invalid && this.f['intervalo_ping'].touched; }

  cargar(): void {
    this.cargando.set(true);
    this.dispositivosService.listar().subscribe({
      next: devs => { this.dispositivos.set(devs); this.cargando.set(false); },
      error: ()  => this.cargando.set(false)
    });
  }

  abrirNuevo(): void {
    this.inicializarForm();
    this.modoEdicion.set(false);
    this.mostrarModal.set(true);
  }

  abrirEditar(d: Dispositivo): void {
    this.inicializarForm(d);
    this.dispositivoEditandoId = d._id;
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
      ? this.dispositivosService.actualizar(this.dispositivoEditandoId, payload)
      : this.dispositivosService.crear(payload);

    obs.subscribe({
      next: () => {
        this.mensajeExito.set(this.modoEdicion() ? 'Dispositivo actualizado correctamente.' : 'Dispositivo creado correctamente.');
        this.cerrarModal();
        this.cargar();
        setTimeout(() => this.mensajeExito.set(''), 3000);
      },
      error: err => this.mensajeError.set(err?.error?.detail || 'Error al guardar.')
    });
  }

  eliminar(id: string): void {
    if (!confirm('¿Deseas eliminar este dispositivo?')) return;
    this.dispositivosService.eliminar(id).subscribe({
      next: () => { this.mensajeExito.set('Dispositivo eliminado.'); this.cargar(); setTimeout(() => this.mensajeExito.set(''), 3000); },
      error: ()  => this.mensajeError.set('Error al eliminar.')
    });
  }

  etiquetaEstado(e: string): string {
    return ({ activo: 'Activo', inactivo: 'Inactivo', degradado: 'Degradado', sin_monitoreo: 'Sin Monitoreo' } as any)[e] || e;
  }
}
