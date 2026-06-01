import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioCompleto, UsuarioCreate, UsuarioUpdate } from '../models/configuracion.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<UsuarioCompleto[]> {
    return this.http.get<UsuarioCompleto[]>(this.apiUrl);
  }

  obtener(id: string): Observable<UsuarioCompleto> {
    return this.http.get<UsuarioCompleto>(`${this.apiUrl}/${id}`);
  }

  crear(data: UsuarioCreate): Observable<UsuarioCompleto> {
    return this.http.post<UsuarioCompleto>(this.apiUrl, data);
  }

  actualizar(id: string, data: UsuarioUpdate): Observable<UsuarioCompleto> {
    return this.http.put<UsuarioCompleto>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
