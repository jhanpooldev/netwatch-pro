import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Output() linkClicked = new EventEmitter<void>();

  constructor(public authService: AuthService) {}

  menuItems = [
    { ruta: '/dashboard', etiqueta: 'Dashboard', codigo: 'D', descripcion: 'Vista General' },
    { ruta: '/dispositivos', etiqueta: 'Dispositivos', codigo: 'N', descripcion: 'Nodos de Red' },
    { ruta: '/incidencias', etiqueta: 'Incidencias', codigo: 'T', descripcion: 'Tickets' },
    { ruta: '/alertas', etiqueta: 'Alertas', codigo: 'A', descripcion: 'Notificaciones' },
    { ruta: '/reportes', etiqueta: 'Reportes', codigo: 'R', descripcion: 'Estadísticas' },
    { ruta: '/configuracion', etiqueta: 'Configuración', codigo: 'C', descripcion: 'Ajustes' },
  ];
}
