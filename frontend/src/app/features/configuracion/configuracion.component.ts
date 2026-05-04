import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="module-page">
      <div class="page-header">
        <div>
          <h1>CONFIGURACIÓN_DEL_SISTEMA</h1>
          <p class="subtitle">&gt; Ajustes generales de NetWatch Pro</p>
        </div>
      </div>
      <div class="config-grid">
        <a routerLink="/dispositivos" class="config-card">
          <div class="config-icon">◈</div>
          <div class="config-body">
            <div class="config-title">GESTIÓN DE DISPOSITIVOS</div>
            <div class="config-desc">Agregar, editar y eliminar nodos monitoreados. Configurar IPs e intervalos de ping.</div>
          </div>
          <div class="config-arrow">→</div>
        </a>
        <div class="config-card coming-soon">
          <div class="config-icon">⊞</div>
          <div class="config-body">
            <div class="config-title">GESTIÓN DE USUARIOS</div>
            <div class="config-desc">Crear usuarios, asignar roles (Admin, Técnico, Observador) y gestionar accesos.</div>
          </div>
          <div class="badge-soon">PRÓXIMAMENTE</div>
        </div>
        <div class="config-card coming-soon">
          <div class="config-icon">⊕</div>
          <div class="config-body">
            <div class="config-title">UMBRALES DE ALERTA</div>
            <div class="config-desc">Definir latencia máxima, porcentaje de pérdida de paquetes y canales de notificación.</div>
          </div>
          <div class="badge-soon">PRÓXIMAMENTE</div>
        </div>
        <div class="config-card coming-soon">
          <div class="config-icon">▣</div>
          <div class="config-body">
            <div class="config-title">NOTIFICACIONES</div>
            <div class="config-desc">Configurar correo SMTP, destinatarios de alertas críticas y plantillas de email.</div>
          </div>
          <div class="badge-soon">PRÓXIMAMENTE</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../dispositivos/dispositivos.component.scss' as *;

    .config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }

    .config-card {
      display: flex; align-items: center; gap: 1.25rem;
      background: var(--bg-panel); border: 1px solid var(--border-color);
      padding: 1.5rem; text-decoration: none;
      transition: all 0.2s; cursor: pointer;

      &:not(.coming-soon):hover {
        border-color: var(--accent-cyan);
        background: rgba(0, 255, 204, 0.03);
        .config-arrow { color: var(--accent-cyan); }
        .config-icon { color: var(--accent-cyan); }
      }

      &.coming-soon { opacity: 0.5; cursor: default; }
    }

    .config-icon { font-size: 1.5rem; color: var(--text-secondary); flex-shrink: 0; }
    .config-body { flex: 1; }
    .config-title { font-family: var(--font-display); font-size: 0.75rem; letter-spacing: 2px; color: #fff; margin-bottom: 0.4rem; }
    .config-desc { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; }
    .config-arrow { font-family: var(--font-display); font-size: 1.25rem; color: var(--text-secondary); flex-shrink: 0; transition: color 0.2s; }
    .badge-soon { font-family: var(--font-display); font-size: 0.55rem; letter-spacing: 1px; padding: 3px 8px; border: 1px solid var(--border-highlight); color: var(--text-secondary); white-space: nowrap; flex-shrink: 0; }
  `]
})
export class ConfiguracionComponent {}
