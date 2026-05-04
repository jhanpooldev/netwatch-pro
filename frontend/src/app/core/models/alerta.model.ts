export interface Alerta {
  _id: string;
  mensaje: string;
  nivel: 'informacion' | 'advertencia' | 'alto' | 'critico';
  dispositivo_id?: any;
  tipo_evento: 'caida' | 'latencia_alta' | 'perdida_paquetes' | 'recuperacion';
  valor_detectado?: number;
  umbral_configurado?: number;
  reconocida: boolean;
  reconocida_por?: any;
  fecha_generacion: Date;
  fecha_reconocimiento?: Date;
}

export interface ListadoAlertas {
  total: number;
  datos: Alerta[];
}
