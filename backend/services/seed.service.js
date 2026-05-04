const Usuario = require('../models/Usuario');
const Dispositivo = require('../models/Dispositivo');
const Alerta = require('../models/Alerta');
const Incidencia = require('../models/Incidencia');
const mongoose = require('mongoose');

async function sembrarDatos() {
  try {
    const count = await Usuario.countDocuments();
    if (count > 0) {
      console.log('ℹ️  La base de datos ya tiene datos. Seeding omitido.');
      return;
    }

    console.log('🌱 Sembrando datos iniciales...');

    const admin = new Usuario({ nombre: 'Administrador', correo: 'admin@netwatch.com', password_hash: 'Admin1234!', rol: 'admin' });
    const tecnico = new Usuario({ nombre: 'Técnico TI', correo: 'tecnico@netwatch.com', password_hash: 'Tecnico1234!', rol: 'tecnico' });
    const observador = new Usuario({ nombre: 'Gerente TI', correo: 'gerente@netwatch.com', password_hash: 'Gerente1234!', rol: 'observador' });
    await Promise.all([admin.save(), tecnico.save(), observador.save()]);

    const dispositivos = [
      { nombre: 'Router Principal', ip_address: '8.8.8.8', tipo: 'router', ubicacion: 'Sala de Servidores - Rack A1', estado: 'sin_monitoreo', intervalo_ping: 60 },
      { nombre: 'Switch Distribución', ip_address: '1.1.1.1', tipo: 'switch', ubicacion: 'Piso 2 - Closet de Red', estado: 'sin_monitoreo', intervalo_ping: 60 },
      { nombre: 'Servidor Web', ip_address: '208.67.222.222', tipo: 'servidor', ubicacion: 'Centro de Datos', estado: 'sin_monitoreo', intervalo_ping: 60 },
      { nombre: 'Servidor DB', ip_address: '9.9.9.9', tipo: 'servidor', ubicacion: 'Centro de Datos', estado: 'sin_monitoreo', intervalo_ping: 60 },
      { nombre: 'Firewall Perimetral', ip_address: '8.8.4.4', tipo: 'router', ubicacion: 'Sala de Servidores - Rack A2', estado: 'sin_monitoreo', intervalo_ping: 60 },
    ];

    await Dispositivo.insertMany(dispositivos);
    console.log('✅ Datos iniciales sembrados correctamente.');
    console.log('  👤 admin@netwatch.com / Admin1234!');
    console.log('  👤 tecnico@netwatch.com / Tecnico1234!');
    console.log('  👤 gerente@netwatch.com / Gerente1234!');
  } catch (err) {
    console.error('❌ Error sembrando datos:', err.message);
  }
}

module.exports = { sembrarDatos };
