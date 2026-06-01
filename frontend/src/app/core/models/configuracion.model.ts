export interface UsuarioCompleto {
  _id: string;
  nombre: string;
  correo: string;
  rol: 'admin' | 'tecnico' | 'observador';
  activo: boolean;
  ultimo_acceso: string | null;
  created_at: string;
}

export interface UsuarioCreate {
  nombre: string;
  correo: string;
  password: string;
  rol: 'admin' | 'tecnico' | 'observador';
  activo: boolean;
}

export interface UsuarioUpdate {
  nombre?: string;
  correo?: string;
  rol?: string;
  activo?: boolean;
  password?: string;
}

export interface Umbrales {
  latencia_maxima_ms: number;
  perdida_paquetes_pct: number;
  intervalo_ping_defecto: number;
  alerta_recuperacion: boolean;
}

export interface SmtpConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_usuario: string;
  smtp_password: string;
  smtp_tls: boolean;
  destinatarios: string[];
  notificar_critico: boolean;
  notificar_advertencia: boolean;
  notificar_recuperacion: boolean;
}
