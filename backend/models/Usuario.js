const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  rol: { type: String, enum: ['admin', 'tecnico', 'observador'], default: 'observador' },
  activo: { type: Boolean, default: true },
  ultimo_acceso: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});

// Hash de contraseña antes de guardar
usuarioSchema.pre('save', async function () {
  if (!this.isModified('password_hash')) return;
  this.password_hash = await bcrypt.hash(this.password_hash, 12);
});

// Comparar contraseña
usuarioSchema.methods.compararPassword = function (password) {
  return bcrypt.compare(password, this.password_hash);
};

module.exports = mongoose.model('Usuario', usuarioSchema);
