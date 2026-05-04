import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dispositivo, EstadisticasDispositivos } from '../models/dispositivo.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DispositivosService {
  private apiUrl = `${environment.apiUrl}/dispositivos`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Dispositivo[]> {
    return this.http.get<Dispositivo[]>(this.apiUrl);
  }

  obtener(id: string): Observable<Dispositivo> {
    return this.http.get<Dispositivo>(`${this.apiUrl}/${id}`);
  }

  crear(dispositivo: Partial<Dispositivo>): Observable<Dispositivo> {
    return this.http.post<Dispositivo>(this.apiUrl, dispositivo);
  }

  actualizar(id: string, datos: Partial<Dispositivo>): Observable<Dispositivo> {
    return this.http.put<Dispositivo>(`${this.apiUrl}/${id}`, datos);
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  estadisticas(): Observable<EstadisticasDispositivos> {
    return this.http.get<EstadisticasDispositivos>(`${this.apiUrl}/estadisticas`);
  }
}
