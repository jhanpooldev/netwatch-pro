export interface Dispositivo {
  _id: string;
  nombre: string;
  ip_address: string;
  mac_address?: string;
  tipo: 'router' | 'switch' | 'servidor' | 'workstation' | 'impresora' | 'otro';
  ubicacion: string;
  estado: 'activo' | 'inactivo' | 'degradado' | 'sin_monitoreo';
  latencia_actual: number | null;
  intervalo_ping: number;
  ultima_verificacion: Date | null;
  uptime_porcentaje: number;
  created_at: Date;
}

export interface EstadisticasDispositivos {
  total: number;
  activos: number;
  inactivos: number;
  degradados: number;
}
