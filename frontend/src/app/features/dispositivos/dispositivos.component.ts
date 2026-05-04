import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispositivosService } from '../../core/services/dispositivos.service';
import { Dispositivo } from '../../core/models/dispositivo.model';

@Component({
  selector: 'app-dispositivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dispositivos.component.html',
  styleUrl: './dispositivos.component.scss'
})
export class DispositivosComponent implements OnInit {
  dispositivos = signal<Dispositivo[]>([]);
  cargando = signal(true);
  mostrarModal = signal(false);
  modoEdicion = signal(false);
  mensajeExito = signal('');
  mensajeError = signal('');

  form: Partial<Dispositivo> = this.formVacio();
  dispositivoEditandoId = '';

  constructor(private dispositivosService: DispositivosService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    this.dispositivosService.listar().subscribe({
      next: devs => { this.dispositivos.set(devs); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  formVacio(): Partial<Dispositivo> {
    return { nombre: '', ip_address: '', mac_address: '', tipo: 'otro', ubicacion: '', intervalo_ping: 60, estado: 'sin_monitoreo' };
  }

  abrirNuevo(): void {
    this.form = this.formVacio();
    this.modoEdicion.set(false);
    this.mostrarModal.set(true);
  }

  abrirEditar(d: Dispositivo): void {
    this.form = { ...d };
    this.dispositivoEditandoId = d._id;
    this.modoEdicion.set(true);
    this.mostrarModal.set(true);
  }

  cerrarModal(): void { this.mostrarModal.set(false); this.mensajeError.set(''); }

  guardar(): void {
    if (!this.form.nombre || !this.form.ip_address) {
      this.mensajeError.set('Nombre e IP son requeridos.');
      return;
    }
    const obs = this.modoEdicion()
      ? this.dispositivosService.actualizar(this.dispositivoEditandoId, this.form)
      : this.dispositivosService.crear(this.form);

    obs.subscribe({
      next: () => {
        this.mensajeExito.set(this.modoEdicion() ? 'Dispositivo actualizado correctamente.' : 'Dispositivo creado correctamente.');
        this.cerrarModal();
        this.cargar();
        setTimeout(() => this.mensajeExito.set(''), 3000);
      },
      error: err => this.mensajeError.set(err?.error?.mensaje || 'Error al guardar.')
    });
  }

  eliminar(id: string): void {
    if (!confirm('¿Deseas eliminar este dispositivo?')) return;
    this.dispositivosService.eliminar(id).subscribe({
      next: () => { this.mensajeExito.set('Dispositivo eliminado.'); this.cargar(); setTimeout(() => this.mensajeExito.set(''), 3000); },
      error: () => this.mensajeError.set('Error al eliminar.')
    });
  }

  etiquetaEstado(e: string): string {
    return ({ activo: 'Activo', inactivo: 'Inactivo', degradado: 'Degradado', sin_monitoreo: 'Sin Monitoreo' } as any)[e] || e;
  }
}
