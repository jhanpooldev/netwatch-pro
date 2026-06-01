import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../core/services/usuarios.service';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioCompleto, UsuarioCreate } from '../../core/models/configuracion.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent implements OnInit {
  usuarios = signal<UsuarioCompleto[]>([]);
  cargando = signal(true);
  mostrarModal = signal(false);
  modoEdicion = signal(false);
  mensajeExito = signal('');
  mensajeError = signal('');
  mostrarPassword = signal(false);

  usuarioEditandoId = '';
  form: Partial<UsuarioCreate & { activo: boolean }> = this.formVacio();

  constructor(
    private usuariosService: UsuariosService,
    public authService: AuthService
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    this.usuariosService.listar().subscribe({
      next: u => { this.usuarios.set(u); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  formVacio(): Partial<UsuarioCreate & { activo: boolean }> {
    return { nombre: '', correo: '', password: '', rol: 'tecnico', activo: true };
  }

  abrirNuevo(): void {
    this.form = this.formVacio();
    this.modoEdicion.set(false);
    this.mostrarModal.set(true);
    this.mensajeError.set('');
    this.mostrarPassword.set(false);
  }

  abrirEditar(u: UsuarioCompleto): void {
    this.form = {
      nombre: u.nombre,
      correo: u.correo,
      rol: u.rol,
      activo: u.activo,
      password: ''
    };
    this.usuarioEditandoId = u._id;
    this.modoEdicion.set(true);
    this.mostrarModal.set(true);
    this.mensajeError.set('');
    this.mostrarPassword.set(false);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.mensajeError.set('');
  }

  guardar(): void {
    if (!this.form.nombre?.trim() || !this.form.correo?.trim()) {
      this.mensajeError.set('Nombre y correo son requeridos.');
      return;
    }
    if (!this.modoEdicion() && !this.form.password?.trim()) {
      this.mensajeError.set('La contraseña es requerida para usuarios nuevos.');
      return;
    }

    if (this.modoEdicion()) {
      const update: any = {
        nombre: this.form.nombre,
        correo: this.form.correo,
        rol: this.form.rol,
        activo: this.form.activo
      };
      if (this.form.password?.trim()) {
        update.password = this.form.password;
      }
      this.usuariosService.actualizar(this.usuarioEditandoId, update).subscribe({
        next: () => {
          this.mensajeExito.set('Usuario actualizado correctamente.');
          this.cerrarModal();
          this.cargar();
          setTimeout(() => this.mensajeExito.set(''), 3500);
        },
        error: err => this.mensajeError.set(err?.error?.detail || 'Error al actualizar.')
      });
    } else {
      this.usuariosService.crear(this.form as UsuarioCreate).subscribe({
        next: () => {
          this.mensajeExito.set('Usuario creado correctamente.');
          this.cerrarModal();
          this.cargar();
          setTimeout(() => this.mensajeExito.set(''), 3500);
        },
        error: err => this.mensajeError.set(err?.error?.detail || 'Error al crear.')
      });
    }
  }

  toggleEstado(u: UsuarioCompleto): void {
    const nuevoEstado = !u.activo;
    this.usuariosService.actualizar(u._id, { activo: nuevoEstado }).subscribe({
      next: () => {
        this.mensajeExito.set(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`);
        this.cargar();
        setTimeout(() => this.mensajeExito.set(''), 3000);
      },
      error: err => this.mensajeError.set(err?.error?.detail || 'Error al cambiar estado.')
    });
  }

  eliminar(u: UsuarioCompleto): void {
    if (!confirm(`¿Deseas eliminar al usuario "${u.nombre}"? Esta acción no se puede deshacer.`)) return;
    this.usuariosService.eliminar(u._id).subscribe({
      next: () => {
        this.mensajeExito.set('Usuario eliminado.');
        this.cargar();
        setTimeout(() => this.mensajeExito.set(''), 3000);
      },
      error: err => this.mensajeError.set(err?.error?.detail || 'Error al eliminar.')
    });
  }

  etiquetaRol(rol: string): string {
    return ({ admin: 'Admin', tecnico: 'Técnico', observador: 'Observador' } as any)[rol] || rol;
  }

  countActivos(): number {
    return this.usuarios().filter(u => u.activo).length;
  }

  countByRol(rol: string): number {
    return this.usuarios().filter(u => u.rol === rol).length;
  }

  esYo(u: UsuarioCompleto): boolean {
    const yo = this.authService.usuario();
    if (!yo) return false;
    return (yo as any).id === u._id || (yo as any)._id === u._id;
  }
}
