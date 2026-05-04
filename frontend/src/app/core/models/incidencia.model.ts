export interface Incidencia {
  _id: string;
  titulo: string;
  descripcion: string;
  dispositivo_id?: any;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  estado: 'abierta' | 'en_progreso' | 'resuelta' | 'cerrada';
  tecnico_id?: any;
  alerta_id?: string;
  historial: HistorialItem[];
  adjuntos: string[];
  fecha_apertura: Date;
  fecha_estimada?: Date;
  fecha_cierre?: Date;
  tiempo_resolucion?: number;
}

export interface HistorialItem {
  estado_anterior?: string;
  estado_nuevo: string;
  usuario_id?: any;
  comentario?: string;
  fecha: Date;
}

export interface ListadoIncidencias {
  total: number;
  pagina: number;
  limit: number;
  datos: Incidencia[];
}

export interface EstadisticasIncidencias {
  total: number;
  abiertas: number;
  en_progreso: number;
  resueltas: number;
  criticas: number;
}
