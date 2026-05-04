import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  correo = '';
  password = '';
  mostrarPassword = false;
  cargando = signal(false);
  error = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  iniciarSesion(): void {
    if (!this.correo || !this.password) {
      this.error.set('Ingresa tu correo y contraseña.');
      return;
    }
    this.cargando.set(true);
    this.error.set('');

    this.authService.login({ correo: this.correo, password: this.password }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.mensaje || 'Error al conectar con el servidor.');
      }
    });
  }
}
