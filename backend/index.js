require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { sembrarDatos } = require('./services/seed.service');
const { iniciarMonitoreo } = require('./services/monitoreo.service');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middlewares
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

// Inyectar io en cada request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/dispositivos', require('./routes/dispositivos.routes'));
app.use('/api/incidencias', require('./routes/incidencias.routes'));
app.use('/api/alertas', require('./routes/alertas.routes'));

app.get('/api/status', (req, res) => {
  res.json({ status: 'NetWatch Pro API en línea', timestamp: new Date() });
});

// Conexión MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/netwatch_pro')
  .then(async () => {
    console.log('✅ Conectado a MongoDB (NetWatch Pro)');
    await sembrarDatos();
    iniciarMonitoreo(io);
  })
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// Eventos Socket.IO
io.on('connection', (socket) => {
  console.log(`🔌 Cliente WebSocket conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Cliente WebSocket desconectado: ${socket.id}`);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 NetWatch Pro Backend corriendo en http://localhost:${PORT}`);
});
