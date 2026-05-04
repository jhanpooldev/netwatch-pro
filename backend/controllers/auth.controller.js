const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// POST /api/auth/login
exports.login = async (req, res) => {
  const { correo, password } = req.body;
  try {
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    if (!usuario.activo) return res.status(403).json({ mensaje: 'Cuenta inactiva. Contacta al administrador.' });

    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });

    usuario.ultimo_acceso = new Date();
    await usuario.save();

    const token = jwt.sign(
      { id: usuario._id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

// GET /api/auth/perfil
exports.perfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-password_hash');
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};
