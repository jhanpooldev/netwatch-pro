import os
import uvicorn
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from app.socket import sio
from app.seeding import sembrar_datos
from app.monitoring import iniciar_monitoreo
from app.routes import auth, dispositivos, incidencias, alertas, usuarios, configuracion

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización al arrancar
    try:
        sembrar_datos()
    except Exception as e:
        print(f"Error al sembrar datos iniciales: {e}")
    
    # Inicio del ciclo del monitoreo en segundo plano
    iniciar_monitoreo()
    yield
    # Limpieza al apagar (si fuera necesario)

app = FastAPI(
    title="NetWatch Pro API",
    description="Backend en Python (FastAPI + Socket.IO) para el monitoreo de redes en tiempo real",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar políticas CORS para el cliente Angular (http://localhost:4200)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers de la API REST
app.include_router(auth.router)
app.include_router(dispositivos.router)
app.include_router(incidencias.router)
app.include_router(alertas.router)
app.include_router(usuarios.router)
app.include_router(configuracion.router)

@app.get("/api/status")
def get_status():
    return {
        "status": "NetWatch Pro API en línea (Python)",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Manejadores de eventos de Socket.IO
@sio.event
async def connect(sid, environ):
    print(f"Cliente WebSocket conectado: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Cliente WebSocket desconectado: {sid}")

# Envolver la aplicación FastAPI con el servidor Socket.IO ASGI
asgi_app = socketio.ASGIApp(sio, other_asgi_app=app)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    # Desactivamos reload si vamos a ejecutarlo en producción/hilos, pero lo dejamos activo para desarrollo local
    uvicorn.run("main:asgi_app", host="127.0.0.1", port=port, reload=True)
