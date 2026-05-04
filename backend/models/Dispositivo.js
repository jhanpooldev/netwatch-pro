const mongoose = require('mongoose');

const dispositivoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  ip_address: { type: String, required: true },
  mac_address: { type: String, default: '' },
  tipo: {
    type: String,
    enum: ['router', 'switch', 'servidor', 'workstation', 'impresora', 'otro'],
    default: 'otro'
  },
  ubicacion: { type: String, default: '' },
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'degradado', 'sin_monitoreo'],
    default: 'sin_monitoreo'
  },
  latencia_actual: { type: Number, default: null },
  intervalo_ping: { type: Number, default: 60 },
  ultima_verificacion: { type: Date, default: null },
  uptime_porcentaje: { type: Number, default: 100 },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Dispositivo', dispositivoSchema);
