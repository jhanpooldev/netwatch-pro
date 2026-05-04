const Alerta = require('../models/Alerta');

exports.listar = async (req, res) => {
  try {
    const { nivel, reconocida, page = 1, limit = 20 } = req.query;
    const filtro = {};
    if (nivel) filtro.nivel = nivel;
    if (reconocida !== undefined) filtro.reconocida = reconocida === 'true';

    const total = await Alerta.countDocuments(filtro);
    const alertas = await Alerta.find(filtro)
      .populate('dispositivo_id', 'nombre ip_address')
      .populate('reconocida_por', 'nombre')
      .sort({ fecha_generacion: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ total, datos: alertas });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener alertas.' });
  }
};

exports.reconocer = async (req, res) => {
  try {
    const alerta = await Alerta.findByIdAndUpdate(
      req.params.id,
      {
        reconocida: true,
        reconocida_por: req.usuario.id,
        fecha_reconocimiento: new Date()
      },
      { new: true }
    );
    if (!alerta) return res.status(404).json({ mensaje: 'Alerta no encontrada.' });
    req.io.emit('alerta_reconocida', { id: alerta._id });
    res.json(alerta);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al reconocer alerta.' });
  }
};

exports.contarCriticas = async (req, res) => {
  try {
    const count = await Alerta.countDocuments({ nivel: 'critico', reconocida: false });
    res.json({ criticas_no_reconocidas: count });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al contar alertas críticas.' });
  }
};
