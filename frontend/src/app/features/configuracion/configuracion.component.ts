import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { AuthService } from '../../core/services/auth.service';
import { Umbrales, SmtpConfig } from '../../core/models/configuracion.model';

type Tab = 'inicio' | 'umbrales' | 'smtp';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss'
})
export class ConfiguracionComponent implements OnInit {
  tabActiva      = signal<Tab>('inicio');
  cargando       = signal(false);
  mensajeExito   = signal('');
  mensajeError   = signal('');
  cargandoUmbrales = signal(false);
  cargandoSmtp     = signal(false);
  enviandoPrueba   = signal(false);

  formUmbrales!: FormGroup;
  formSmtp!: FormGroup;

  // Destinatarios (lista auxiliar fuera del form por ser un array dinámico)
  destinatarios: string[] = [];
  nuevoDestinatario = '';

  constructor(
    private configService: ConfiguracionService,
    public  authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormUmbrales();
    this.inicializarFormSmtp();
  }

  // ── Formulario Umbrales ───────────────────────────────────────────────────
  inicializarFormUmbrales(data?: Umbrales): void {
    this.formUmbrales = this.fb.group({
      latencia_maxima_ms:     [data?.latencia_maxima_ms     ?? 200,  [Validators.required, Validators.min(1),  Validators.max(10000)]],
      perdida_paquetes_pct:   [data?.perdida_paquetes_pct   ?? 10,   [Validators.required, Validators.min(0),  Validators.max(100)]],
      intervalo_ping_defecto: [data?.intervalo_ping_defecto ?? 60,   [Validators.required, Validators.min(5),  Validators.max(3600)]],
      alerta_recuperacion:    [data?.alerta_recuperacion    ?? true]
    });
    if (!this.esAdmin()) this.formUmbrales.disable();
  }

  get fu() { return this.formUmbrales?.controls; }

  // ── Formulario SMTP ───────────────────────────────────────────────────────
  inicializarFormSmtp(data?: Partial<SmtpConfig>): void {
    this.formSmtp = this.fb.group({
      smtp_host:              [data?.smtp_host              ?? '', Validators.required],
      smtp_port:              [data?.smtp_port              ?? 587, [Validators.required, Validators.min(1), Validators.max(65535)]],
      smtp_usuario:           [data?.smtp_usuario           ?? '', [Validators.required, Validators.email]],
      smtp_password:          [data?.smtp_password          ?? ''],
      smtp_tls:               [data?.smtp_tls               ?? true],
      notificar_critico:      [data?.notificar_critico      ?? true],
      notificar_advertencia:  [data?.notificar_advertencia  ?? true],
      notificar_recuperacion: [data?.notificar_recuperacion ?? false]
    });
    if (!this.esAdmin()) this.formSmtp.disable();
  }

  get fs() { return this.formSmtp?.controls; }

  irTab(tab: Tab): void {
    this.tabActiva.set(tab);
    this.mensajeExito.set('');
    this.mensajeError.set('');
    if (tab === 'umbrales') this.cargarUmbrales();
    if (tab === 'smtp')     this.cargarSmtp();
  }

  // ── Umbrales ──────────────────────────────────────────────────────────────
  cargarUmbrales(): void {
    this.cargandoUmbrales.set(true);
    this.configService.getUmbrales().subscribe({
      next: u => { this.inicializarFormUmbrales(u); this.cargandoUmbrales.set(false); },
      error: () => this.cargandoUmbrales.set(false)
    });
  }

  guardarUmbrales(): void {
    this.formUmbrales.markAllAsTouched();
    if (this.formUmbrales.invalid) {
      this.mensajeError.set('Revisa los valores de los umbrales antes de guardar.');
      return;
    }
    this.cargando.set(true);
    this.configService.updateUmbrales(this.formUmbrales.getRawValue()).subscribe({
      next: u => {
        this.inicializarFormUmbrales(u);
        this.mensajeExito.set('Umbrales actualizados. El motor de monitoreo los aplicará en el próximo ciclo.');
        this.cargando.set(false);
        setTimeout(() => this.mensajeExito.set(''), 4000);
      },
      error: err => { this.mensajeError.set(err?.error?.detail || 'Error al guardar umbrales.'); this.cargando.set(false); }
    });
  }

  // ── SMTP ──────────────────────────────────────────────────────────────────
  cargarSmtp(): void {
    this.cargandoSmtp.set(true);
    this.configService.getSmtp().subscribe({
      next: s => {
        this.destinatarios = s.destinatarios ?? [];
        this.inicializarFormSmtp(s);
        this.cargandoSmtp.set(false);
      },
      error: () => this.cargandoSmtp.set(false)
    });
  }

  guardarSmtp(): void {
    this.formSmtp.markAllAsTouched();
    if (this.formSmtp.invalid) {
      this.mensajeError.set('Revisa los datos del servidor SMTP antes de guardar.');
      return;
    }
    this.cargando.set(true);
    const payload = { ...this.formSmtp.getRawValue(), destinatarios: this.destinatarios };
    this.configService.updateSmtp(payload).subscribe({
      next: s => {
        this.destinatarios = s.destinatarios ?? [];
        this.inicializarFormSmtp(s);
        this.mensajeExito.set('Configuración SMTP guardada correctamente.');
        this.cargando.set(false);
        setTimeout(() => this.mensajeExito.set(''), 3500);
      },
      error: err => { this.mensajeError.set(err?.error?.detail || 'Error al guardar SMTP.'); this.cargando.set(false); }
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
      error: err => { this.mensajeError.set(err?.error?.detail || 'Error al enviar email de prueba.'); this.enviandoPrueba.set(false); }
    });
  }

  agregarDestinatario(): void {
    const email = this.nuevoDestinatario.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    if (!this.destinatarios.includes(email)) {
      this.destinatarios = [...this.destinatarios, email];
    }
    this.nuevoDestinatario = '';
  }

  quitarDestinatario(email: string): void {
    this.destinatarios = this.destinatarios.filter(d => d !== email);
  }

  esAdmin(): boolean { return this.authService.tieneRol('admin'); }
}
