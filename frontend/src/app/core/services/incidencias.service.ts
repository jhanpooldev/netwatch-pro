import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Incidencia, ListadoIncidencias, EstadisticasIncidencias } from '../models/incidencia.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IncidenciasService {
  private apiUrl = `${environment.apiUrl}/incidencias`;

  constructor(private http: HttpClient) {}

  listar(filtros: any = {}): Observable<ListadoIncidencias> {
    let params = new HttpParams();
    Object.keys(filtros).forEach(k => {
      if (filtros[k] !== null && filtros[k] !== undefined && filtros[k] !== '') {
        params = params.set(k, filtros[k]);
      }
    });
    return this.http.get<ListadoIncidencias>(this.apiUrl, { params });
  }

  obtener(id: string): Observable<Incidencia> {
    return this.http.get<Incidencia>(`${this.apiUrl}/${id}`);
  }

  crear(incidencia: Partial<Incidencia>): Observable<Incidencia> {
    return this.http.post<Incidencia>(this.apiUrl, incidencia);
  }

  actualizar(id: string, datos: Partial<Incidencia> & { comentario?: string }): Observable<Incidencia> {
    return this.http.put<Incidencia>(`${this.apiUrl}/${id}`, datos);
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  estadisticas(): Observable<EstadisticasIncidencias> {
    return this.http.get<EstadisticasIncidencias>(`${this.apiUrl}/estadisticas`);
  }
}
