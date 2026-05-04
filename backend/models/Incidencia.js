const mongoose = require('mongoose');

const incidenciaSchema = new mongoose.Schema({
  titulo: { type: String, required: true, maxlength: 100 },
  descripcion: { type: String, required: true },
  dispositivo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispositivo', default: null },
  prioridad: {
    type: String,
    enum: ['baja', 'media', 'alta', 'critica'],
    default: 'media'
  },
  estado: {
    type: String,
    enum: ['abierta', 'en_progreso', 'resuelta', 'cerrada'],
    default: 'abierta'
  },
  tecnico_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  alerta_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Alerta', default: null },
  historial: [
    {
      estado_anterior: String,
      estado_nuevo: String,
      usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
      comentario: String,
      fecha: { type: Date, default: Date.now }
    }
  ],
  adjuntos: [{ type: String }],
  fecha_apertura: { type: Date, default: Date.now },
  fecha_estimada: { type: Date, default: null },
  fecha_cierre: { type: Date, default: null },
  tiempo_resolucion: { type: Number, default: null }
});

module.exports = mongoose.model('Incidencia', incidenciaSchema);
