# 🛰️ NetWatch Pro

Sistema web de monitoreo de redes informáticas en tiempo real.

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 17 + Bootstrap 5 + SCSS |
| Backend | Node.js + Express.js |
| Base de datos | MongoDB (Mongoose ODM) |
| Tiempo real | Socket.IO (WebSockets) |
| Autenticación | JWT + bcrypt |
| Monitoreo | ICMP Ping (`ping` npm) |

## 🚀 Instalación y Ejecución

### Requisitos previos
- Node.js v18+
- MongoDB corriendo localmente en `localhost:27017`

### Backend
```bash
cd backend
npm install
# Crear archivo .env con:
# PORT=3000
# MONGODB_URI=mongodb://127.0.0.1:27017/redes
# JWT_SECRET=tu_secreto_aqui
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

Luego abre: **http://localhost:4200**

## 🔐 Credenciales de Demo

| Usuario | Correo | Contraseña | Rol |
|---------|--------|------------|-----|
| Administrador | admin@netwatch.com | Admin1234! | admin |
| Técnico TI | tecnico@netwatch.com | Tecnico1234! | tecnico |
| Gerente TI | gerente@netwatch.com | Gerente1234! | observador |

> Los usuarios se crean automáticamente al iniciar el backend por primera vez.

## 📦 Módulos

- **Dashboard** — KPIs y mapa de nodos en tiempo real vía WebSocket
- **Dispositivos** — CRUD completo de nodos monitoreados
- **Incidencias** — Gestión de tickets con filtros y paginación
- **Alertas** — Timeline en tiempo real con reconocimiento
- **Reportes** — Estadísticas y métricas de disponibilidad
- **Configuración** — Panel de ajustes del sistema

## 🎨 Diseño

Estética **Dark Industrial / Cyber-tech** con tipografías Orbitron y Chakra Petch, animaciones CSS, microinteracciones y actualización en tiempo real vía WebSocket.
