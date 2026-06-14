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

import logging
from fastapi.responses import JSONResponse
from fastapi import Request
from pymongo.errors import PyMongoError

# Configurar Logging Profesional
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log", encoding="utf-8")
    ]
)
logger = logging.getLogger("netwatch")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando aplicación NetWatch Pro...")
    
    # Verificar seguridad de variables de entorno críticas
    from app.auth import JWT_SECRET
    if JWT_SECRET == "supersecretdarkindustrialnetwatch":
        logger.warning(
            "⚠️ ADVERTENCIA DE CIBERSEGURIDAD: Se está utilizando la clave JWT_SECRET por defecto. "
            "Para producción en Render, debes configurar la variable JWT_SECRET con un valor de alta entropía."
        )

    try:
        sembrar_datos()
        logger.info("Siembra de datos completada.")
    except Exception as e:
        logger.error(f"Error al sembrar datos iniciales: {e}", exc_info=True)
    
    iniciar_monitoreo()
    yield
    logger.info("Deteniendo aplicación NetWatch Pro...")

app = FastAPI(
    title="NetWatch Pro API",
    description="Backend en Python (FastAPI + Socket.IO) para el monitoreo de redes en tiempo real",
    version="1.0.0",
    lifespan=lifespan
)

# Manejadores Globales de Excepciones
@app.exception_handler(PyMongoError)
async def pymongo_exception_handler(request: Request, exc: PyMongoError):
    logger.error(f"Error de base de datos (MongoDB) en {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Error de base de datos interno."}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Excepción no controlada en {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Ocurrió un error inesperado en el servidor."}
    )

# Orígenes permitidos: desarrollo local + producción en Render
ALLOWED_ORIGINS = [
    "http://localhost:4200",
    os.getenv("FRONTEND_URL", "https://netwatch-pro.onrender.com"),
]

# Middleware de Seguridad Cibernética (Cabeceras HTTP de Seguridad)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
