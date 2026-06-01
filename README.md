# 🛰️ NetWatch Pro

Sistema web de monitoreo de redes informáticas en tiempo real.

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 17 + Bootstrap 5 + SCSS |
| Backend | Python (FastAPI + Uvicorn) |
| Base de datos | MongoDB (PyMongo) |
| Tiempo real | Socket.IO (python-socketio) |
| Autenticación | JWT (PyJWT) + bcrypt |
| Monitoreo | ICMP Ping (Subprocess native) |

## 🚀 Instalación y Ejecución

### Requisitos previos
- Python 3.10+
- Node.js v18+ (para el frontend)
- MongoDB corriendo localmente en `localhost:27017`

### Backend (Python)
```bash
cd backend
pip install -r requirements.txt
# Asegúrate de configurar el archivo .env con:
# PORT=3000
# MONGODB_URI=mongodb://127.0.0.1:27017/redes
# JWT_SECRET=supersecretdarkindustrialnetwatch
python main.py
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
