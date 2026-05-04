const mongoose = require('mongoose');

const alertaSchema = new mongoose.Schema({
  mensaje: { type: String, required: true },
  nivel: {
    type: String,
    enum: ['informacion', 'advertencia', 'alto', 'critico'],
    default: 'informacion'
  },
  dispositivo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispositivo' },
  tipo_evento: {
    type: String,
    enum: ['caida', 'latencia_alta', 'perdida_paquetes', 'recuperacion'],
    required: true
  },
  valor_detectado: { type: Number, default: null },
  umbral_configurado: { type: Number, default: null },
  reconocida: { type: Boolean, default: false },
  reconocida_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  fecha_generacion: { type: Date, default: Date.now },
  fecha_reconocimiento: { type: Date, default: null }
});

module.exports = mongoose.model('Alerta', alertaSchema);
