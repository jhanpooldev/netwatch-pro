const Incidencia = require('../models/Incidencia');

exports.listar = async (req, res) => {
  try {
    const { estado, prioridad, page = 1, limit = 10 } = req.query;
    const filtro = {};
    if (estado) filtro.estado = estado;
    if (prioridad) filtro.prioridad = prioridad;

    const total = await Incidencia.countDocuments(filtro);
    const incidencias = await Incidencia.find(filtro)
      .populate('dispositivo_id', 'nombre ip_address')
      .populate('tecnico_id', 'nombre correo')
      .sort({ fecha_apertura: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ total, pagina: Number(page), limit: Number(limit), datos: incidencias });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener incidencias.' });
  }
};

exports.crear = async (req, res) => {
  try {
    const incidencia = new Incidencia({
      ...req.body,
      historial: [{ estado_anterior: null, estado_nuevo: 'abierta', usuario_id: req.usuario.id, comentario: 'Incidencia creada.' }]
    });
    await incidencia.save();
    req.io.emit('incidencia_nueva', incidencia);
    res.status(201).json(incidencia);
  } catch (err) {
    res.status(400).json({ mensaje: err.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const incidencia = await Incidencia.findById(req.params.id)
      .populate('dispositivo_id')
      .populate('tecnico_id', 'nombre correo')
      .populate('alerta_id');
    if (!incidencia) return res.status(404).json({ mensaje: 'Incidencia no encontrada.' });
    res.json(incidencia);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener incidencia.' });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const incidencia = await Incidencia.findById(req.params.id);
    if (!incidencia) return res.status(404).json({ mensaje: 'Incidencia no encontrada.' });

    const estadoAnterior = incidencia.estado;
    Object.assign(incidencia, req.body);

    if (req.body.estado && req.body.estado !== estadoAnterior) {
      incidencia.historial.push({
        estado_anterior: estadoAnterior,
        estado_nuevo: req.body.estado,
        usuario_id: req.usuario.id,
        comentario: req.body.comentario || 'Estado actualizado.'
      });
      if (['resuelta', 'cerrada'].includes(req.body.estado)) {
        incidencia.fecha_cierre = new Date();
        incidencia.tiempo_resolucion = Math.round(
          (incidencia.fecha_cierre - incidencia.fecha_apertura) / 60000
        );
      }
    }

    await incidencia.save();
    req.io.emit('incidencia_actualizada', incidencia);
    res.json(incidencia);
  } catch (err) {
    res.status(400).json({ mensaje: err.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const incidencia = await Incidencia.findByIdAndDelete(req.params.id);
    if (!incidencia) return res.status(404).json({ mensaje: 'Incidencia no encontrada.' });
    res.json({ mensaje: 'Incidencia eliminada.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar incidencia.' });
  }
};

exports.estadisticas = async (req, res) => {
  try {
    const total = await Incidencia.countDocuments();
    const abiertas = await Incidencia.countDocuments({ estado: 'abierta' });
    const en_progreso = await Incidencia.countDocuments({ estado: 'en_progreso' });
    const resueltas = await Incidencia.countDocuments({ estado: 'resuelta' });
    const criticas = await Incidencia.countDocuments({ prioridad: 'critica', estado: { $nin: ['resuelta', 'cerrada'] } });
    res.json({ total, abiertas, en_progreso, resueltas, criticas });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener estadísticas.' });
  }
};
