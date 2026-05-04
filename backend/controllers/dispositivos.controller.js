const Dispositivo = require('../models/Dispositivo');

exports.listar = async (req, res) => {
  try {
    const dispositivos = await Dispositivo.find().sort({ created_at: -1 });
    res.json(dispositivos);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener dispositivos.' });
  }
};

exports.crear = async (req, res) => {
  try {
    const dispositivo = new Dispositivo(req.body);
    await dispositivo.save();
    req.io.emit('dispositivo_nuevo', dispositivo);
    res.status(201).json(dispositivo);
  } catch (err) {
    res.status(400).json({ mensaje: err.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const dispositivo = await Dispositivo.findById(req.params.id);
    if (!dispositivo) return res.status(404).json({ mensaje: 'Dispositivo no encontrado.' });
    res.json(dispositivo);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener dispositivo.' });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const dispositivo = await Dispositivo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dispositivo) return res.status(404).json({ mensaje: 'Dispositivo no encontrado.' });
    req.io.emit('dispositivo_actualizado', dispositivo);
    res.json(dispositivo);
  } catch (err) {
    res.status(400).json({ mensaje: err.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const dispositivo = await Dispositivo.findByIdAndDelete(req.params.id);
    if (!dispositivo) return res.status(404).json({ mensaje: 'Dispositivo no encontrado.' });
    req.io.emit('dispositivo_eliminado', { id: req.params.id });
    res.json({ mensaje: 'Dispositivo eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar dispositivo.' });
  }
};

exports.estadisticas = async (req, res) => {
  try {
    const total = await Dispositivo.countDocuments();
    const activos = await Dispositivo.countDocuments({ estado: 'activo' });
    const inactivos = await Dispositivo.countDocuments({ estado: 'inactivo' });
    const degradados = await Dispositivo.countDocuments({ estado: 'degradado' });
    res.json({ total, activos, inactivos, degradados });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener estadísticas.' });
  }
};
