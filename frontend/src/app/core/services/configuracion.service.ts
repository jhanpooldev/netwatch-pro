import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Umbrales, SmtpConfig } from '../models/configuracion.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private apiUrl = `${environment.apiUrl}/configuracion`;

  constructor(private http: HttpClient) {}

  getUmbrales(): Observable<Umbrales> {
    return this.http.get<Umbrales>(`${this.apiUrl}/umbrales`);
  }

  updateUmbrales(data: Partial<Umbrales>): Observable<Umbrales> {
    return this.http.put<Umbrales>(`${this.apiUrl}/umbrales`, data);
  }

  getSmtp(): Observable<SmtpConfig> {
    return this.http.get<SmtpConfig>(`${this.apiUrl}/smtp`);
  }

  updateSmtp(data: Partial<SmtpConfig>): Observable<SmtpConfig> {
    return this.http.put<SmtpConfig>(`${this.apiUrl}/smtp`, data);
  }

  testSmtp(): Observable<any> {
    return this.http.post(`${this.apiUrl}/smtp/test`, {});
  }
}
