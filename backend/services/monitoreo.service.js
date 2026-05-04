const Usuario = require('../models/Usuario');
const Dispositivo = require('../models/Dispositivo');
const Alerta = require('../models/Alerta');
const Incidencia = require('../models/Incidencia');
const ping = require('ping');

const UMBRAL_LATENCIA = 200; // ms

async function verificarDispositivo(dispositivo, io) {
  try {
    const resultado = await ping.promise.probe(dispositivo.ip_address, { timeout: 5 });
    const latencia = resultado.avg !== 'unknown' ? parseFloat(resultado.avg) : null;
    const estadoAnterior = dispositivo.estado;
    let nuevoEstado = 'activo';

    if (!resultado.alive) {
      nuevoEstado = 'inactivo';
    } else if (latencia && latencia > UMBRAL_LATENCIA) {
      nuevoEstado = 'degradado';
    }

    dispositivo.estado = nuevoEstado;
    dispositivo.latencia_actual = latencia;
    dispositivo.ultima_verificacion = new Date();
    await dispositivo.save();

    // Emitir actualización de estado vía WebSocket
    io.emit('dispositivo_estado', {
      id: dispositivo._id,
      estado: nuevoEstado,
      latencia: latencia,
      ultima_verificacion: dispositivo.ultima_verificacion
    });

    // Generar alerta si cambió de estado
    if (estadoAnterior !== nuevoEstado) {
      let alerta = null;
      if (nuevoEstado === 'inactivo') {
        alerta = new Alerta({
          mensaje: `Dispositivo ${dispositivo.nombre} (${dispositivo.ip_address}) no responde al ping.`,
          nivel: 'critico',
          dispositivo_id: dispositivo._id,
          tipo_evento: 'caida',
          valor_detectado: 0,
          umbral_configurado: 1
        });
      } else if (nuevoEstado === 'degradado') {
        alerta = new Alerta({
          mensaje: `Latencia alta en ${dispositivo.nombre}: ${latencia}ms (umbral: ${UMBRAL_LATENCIA}ms).`,
          nivel: 'advertencia',
          dispositivo_id: dispositivo._id,
          tipo_evento: 'latencia_alta',
          valor_detectado: latencia,
          umbral_configurado: UMBRAL_LATENCIA
        });
      } else if (estadoAnterior === 'inactivo' && nuevoEstado === 'activo') {
        alerta = new Alerta({
          mensaje: `Dispositivo ${dispositivo.nombre} recuperado. Latencia: ${latencia}ms.`,
          nivel: 'informacion',
          dispositivo_id: dispositivo._id,
          tipo_evento: 'recuperacion',
          valor_detectado: latencia,
          umbral_configurado: UMBRAL_LATENCIA
        });
      }
      if (alerta) {
        await alerta.save();
        io.emit('nueva_alerta', alerta);
      }
    }
  } catch (err) {
    console.error(`Error al verificar ${dispositivo.nombre}:`, err.message);
  }
}

async function iniciarMonitoreo(io) {
  console.log('🔍 Servicio de monitoreo iniciado.');
  const ciclo = async () => {
    const dispositivos = await Dispositivo.find({ estado: { $ne: 'sin_monitoreo' } });
    await Promise.all(dispositivos.map(d => verificarDispositivo(d, io)));
  };

  await ciclo();
  setInterval(ciclo, 60000); // Verificar cada 60 segundos
}

module.exports = { iniciarMonitoreo };
