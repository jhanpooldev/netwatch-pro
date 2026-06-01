import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { AuthService } from '../../core/services/auth.service';
import { Umbrales, SmtpConfig } from '../../core/models/configuracion.model';

type Tab = 'inicio' | 'umbrales' | 'smtp';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss'
})
export class ConfiguracionComponent implements OnInit {
  tabActiva = signal<Tab>('inicio');
  cargando = signal(false);
  mensajeExito = signal('');
  mensajeError = signal('');

  // Umbrales
  umbrales: Umbrales = {
    latencia_maxima_ms: 200,
    perdida_paquetes_pct: 10,
    intervalo_ping_defecto: 60,
    alerta_recuperacion: true
  };
  cargandoUmbrales = signal(false);

  // SMTP
  smtp: Partial<SmtpConfig> = {
    smtp_host: '',
    smtp_port: 587,
    smtp_usuario: '',
    smtp_password: '',
    smtp_tls: true,
    destinatarios: [],
    notificar_critico: true,
    notificar_advertencia: true,
    notificar_recuperacion: false
  };
  cargandoSmtp = signal(false);
  nuevoDestinatario = '';
  enviandoPrueba = signal(false);

  constructor(
    private configService: ConfiguracionService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {}

  irTab(tab: Tab): void {
    this.tabActiva.set(tab);
    this.mensajeExito.set('');
    this.mensajeError.set('');

    if (tab === 'umbrales') this.cargarUmbrales();
    if (tab === 'smtp') this.cargarSmtp();
  }

  // ── Umbrales ──────────────────────────────────────────────────────────────
  cargarUmbrales(): void {
    this.cargandoUmbrales.set(true);
    this.configService.getUmbrales().subscribe({
      next: u => { this.umbrales = u; this.cargandoUmbrales.set(false); },
      error: () => this.cargandoUmbrales.set(false)
    });
  }

  guardarUmbrales(): void {
    this.cargando.set(true);
    this.configService.updateUmbrales(this.umbrales).subscribe({
      next: u => {
        this.umbrales = u;
        this.mensajeExito.set('Umbrales actualizados. El motor de monitoreo los aplicará en el próximo ciclo.');
        this.cargando.set(false);
        setTimeout(() => this.mensajeExito.set(''), 4000);
      },
      error: err => {
        this.mensajeError.set(err?.error?.detail || 'Error al guardar umbrales.');
        this.cargando.set(false);
      }
    });
  }

  // ── SMTP ──────────────────────────────────────────────────────────────────
  cargarSmtp(): void {
    this.cargandoSmtp.set(true);
    this.configService.getSmtp().subscribe({
      next: s => { this.smtp = s; this.cargandoSmtp.set(false); },
      error: () => this.cargandoSmtp.set(false)
    });
  }

  guardarSmtp(): void {
    this.cargando.set(true);
    this.configService.updateSmtp(this.smtp).subscribe({
      next: s => {
        this.smtp = s;
        this.mensajeExito.set('Configuración SMTP guardada correctamente.');
        this.cargando.set(false);
        setTimeout(() => this.mensajeExito.set(''), 3500);
      },
      error: err => {
        this.mensajeError.set(err?.error?.detail || 'Error al guardar SMTP.');
        this.cargando.set(false);
      }
    });
  }

  probarSmtp(): void {
    this.enviandoPrueba.set(true);
    this.mensajeExito.set('');
    this.configService.testSmtp().subscribe({
      next: () => {
        this.mensajeExito.set('Email de prueba enviado. Revisa la bandeja de entrada de los destinatarios.');
        this.enviandoPrueba.set(false);
        setTimeout(() => this.mensajeExito.set(''), 5000);
      },
      error: err => {
        this.mensajeError.set(err?.error?.detail || 'Error al enviar email de prueba.');
        this.enviandoPrueba.set(false);
      }
    });
  }

  agregarDestinatario(): void {
    const email = this.nuevoDestinatario.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    if (!this.smtp.destinatarios) this.smtp.destinatarios = [];
    if (!this.smtp.destinatarios.includes(email)) {
      this.smtp.destinatarios = [...this.smtp.destinatarios, email];
    }
    this.nuevoDestinatario = '';
  }

  quitarDestinatario(email: string): void {
    this.smtp.destinatarios = (this.smtp.destinatarios || []).filter(d => d !== email);
  }

  esAdmin(): boolean {
    return this.authService.tieneRol('admin');
  }
}
