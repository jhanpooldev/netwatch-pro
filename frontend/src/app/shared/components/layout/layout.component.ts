import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, CommonModule],
  template: `
    <div class="app-shell">
      <app-navbar (toggleSidebar)="sidebarAbierto.set(!sidebarAbierto())" />
      <div class="shell-body">
        <!-- Overlay oscuro en móvil cuando el sidebar está abierto -->
        @if (sidebarAbierto()) {
          <div class="sidebar-overlay" (click)="sidebarAbierto.set(false)"></div>
        }
        <app-sidebar [class.open]="sidebarAbierto()" (linkClicked)="sidebarAbierto.set(false)" />
        <main class="shell-main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell { display: flex; flex-direction: column; min-height: 100vh; }
    .shell-body { display: flex; flex: 1; overflow: hidden; position: relative; }
    .shell-main {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
      background: var(--bg-primary);
    }
    .sidebar-overlay {
      position: fixed;
      inset: 0;
      top: 57px;
      background: rgba(0,0,0,0.6);
      z-index: 199;
      animation: fade-in 0.2s ease;
    }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

    @media (max-width: 768px) {
      .shell-main { padding: 1rem; }
    }
  `]
})
export class LayoutComponent {
  sidebarAbierto = signal(false);
}
