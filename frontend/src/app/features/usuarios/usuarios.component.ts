import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { UsuariosService } from '../../core/services/usuarios.service';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioCompleto, UsuarioCreate } from '../../core/models/configuracion.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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
  
  // Reactividad de Formulario con Signals
  userForm: FormGroup;

  // Computed Signals para contadores de estadísticas reactivas
  totalUsuarios = computed(() => this.usuarios().length);
  countActivos = computed(() => this.usuarios().filter(u => u.activo).length);
  countAdmin = computed(() => this.usuarios().filter(u => u.rol === 'admin').length);
  countTecnico = computed(() => this.usuarios().filter(u => u.rol === 'tecnico').length);
  countObservador = computed(() => this.usuarios().filter(u => u.rol === 'observador').length);

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    public authService: AuthService
  ) {
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      correo: ['', [Validators.required, Validators.email]],
      rol: ['tecnico', [Validators.required]],
      activo: [true, [Validators.required]],
      password: ['', []]
    });
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    this.usuariosService.listar().subscribe({
      next: u => { this.usuarios.set(u); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  abrirNuevo(): void {
    this.modoEdicion.set(false);
    this.mostrarModal.set(true);
    this.mensajeError.set('');
    this.mostrarPassword.set(false);
    
    this.userForm.reset({
      nombre: '',
      correo: '',
      rol: 'tecnico',
      activo: true,
      password: ''
    });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  abrirEditar(u: UsuarioCompleto): void {
    this.usuarioEditandoId = u._id;
    this.modoEdicion.set(true);
    this.mostrarModal.set(true);
    this.mensajeError.set('');
    this.mostrarPassword.set(false);

    this.userForm.reset({
      nombre: u.nombre,
      correo: u.correo,
      rol: u.rol,
      activo: u.activo,
      password: ''
    });
    this.userForm.get('password')?.setValidators([Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.mensajeError.set('');
  }

  guardar(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.mensajeError.set('Por favor, corrija los errores en el formulario.');
      return;
    }

    const formVal = this.userForm.value;

    if (this.modoEdicion()) {
      const update: any = {
        nombre: formVal.nombre,
        correo: formVal.correo,
        rol: formVal.rol,
        activo: formVal.activo
      };
      if (formVal.password?.trim()) {
        update.password = formVal.password;
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
      this.usuariosService.crear(formVal as UsuarioCreate).subscribe({
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

  esYo(u: UsuarioCompleto): boolean {
    const yo = this.authService.usuario();
    if (!yo) return false;
    return (yo as any).id === u._id || (yo as any)._id === u._id;
  }
}
