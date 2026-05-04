import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse, Usuario } from '../models/usuario.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  // Estado reactivo del usuario actual
  private _usuario = signal<Usuario | null>(null);
  private _token = signal<string | null>(null);

  usuario = this._usuario.asReadonly();
  token = this._token.asReadonly();

  constructor(private http: HttpClient, private router: Router) {
    // Recuperar sesión de sessionStorage al recargar
    const sesion = sessionStorage.getItem('nw_session');
    if (sesion) {
      const { token, usuario } = JSON.parse(sesion);
      this._token.set(token);
      this._usuario.set(usuario);
    }
  }

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(res => {
        this._token.set(res.token);
        this._usuario.set(res.usuario);
        sessionStorage.setItem('nw_session', JSON.stringify({ token: res.token, usuario: res.usuario }));
      })
    );
  }

  logout(): void {
    this._token.set(null);
    this._usuario.set(null);
    sessionStorage.removeItem('nw_session');
    this.router.navigate(['/login']);
  }

  estaAutenticado(): boolean {
    return !!this._token();
  }

  tieneRol(...roles: string[]): boolean {
    const usuario = this._usuario();
    return !!usuario && roles.includes(usuario.rol);
  }

  obtenerToken(): string | null {
    return this._token();
  }
}
