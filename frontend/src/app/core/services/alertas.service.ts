import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alerta, ListadoAlertas } from '../models/alerta.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AlertasService {
  private apiUrl = `${environment.apiUrl}/alertas`;

  constructor(private http: HttpClient) {}

  listar(filtros: any = {}): Observable<ListadoAlertas> {
    let params = new HttpParams();
    Object.keys(filtros).forEach(k => {
      if (filtros[k] !== null && filtros[k] !== undefined && filtros[k] !== '') {
        params = params.set(k, filtros[k]);
      }
    });
    return this.http.get<ListadoAlertas>(this.apiUrl, { params });
  }

  reconocer(id: string): Observable<Alerta> {
    return this.http.put<Alerta>(`${this.apiUrl}/${id}/reconocer`, {});
  }

  contarCriticas(): Observable<{ criticas_no_reconocidas: number }> {
    return this.http.get<{ criticas_no_reconocidas: number }>(`${this.apiUrl}/criticas`);
  }
}
