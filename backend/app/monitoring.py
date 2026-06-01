import asyncio
from datetime import datetime, timezone
import subprocess
import platform
import re
from bson import ObjectId
from app.database import dispositivos_col, alertas_col, configuracion_col
from app.socket import sio

DEFAULT_UMBRAL_LATENCIA = 200  # ms - valor por defecto si no hay config en BD

def get_umbrales():
    """Lee los umbrales actuales desde la base de datos."""
    doc = configuracion_col.find_one({"tipo": "umbrales"})
    if doc:
        return {
            "latencia_maxima_ms": doc.get("latencia_maxima_ms", DEFAULT_UMBRAL_LATENCIA),
            "alerta_recuperacion": doc.get("alerta_recuperacion", True)
        }
    return {"latencia_maxima_ms": DEFAULT_UMBRAL_LATENCIA, "alerta_recuperacion": True}

def ping_host(host: str, timeout: int = 1) -> tuple[bool, float | None]:
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    timeout_param = '-w' if platform.system().lower() == 'windows' else '-W'
    timeout_val = str(timeout * 1000) if platform.system().lower() == 'windows' else str(timeout)
    
    command = ['ping', param, '1', timeout_param, timeout_val, host]
    
    try:
        res = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=timeout + 2)
        if res.returncode == 0:
            match = re.search(r'(?:time|tiempo|Media|Average)[=< ]\s*([\d\.]+)\s*ms', res.stdout, re.IGNORECASE)
            if match:
                return True, float(match.group(1))
            return True, 1.0
        return False, None
    except Exception as e:
        print(f"Error en ping a {host}: {e}")
        return False, None

async def verificar_dispositivo(dispositivo):
    try:
        ip = dispositivo.get("ip_address")
        nombre = dispositivo.get("nombre")
        dispositivo_id = dispositivo.get("_id")
        estado_anterior = dispositivo.get("estado", "sin_monitoreo")
        
        # Leer umbrales dinámicos desde BD
        umbrales = get_umbrales()
        UMBRAL_LATENCIA = umbrales["latencia_maxima_ms"]
        con_alerta_recuperacion = umbrales["alerta_recuperacion"]
        
        loop = asyncio.get_running_loop()
        alive, latencia = await loop.run_in_executor(None, ping_host, ip)
        
        nuevo_estado = "activo"
        if not alive:
            nuevo_estado = "inactivo"
        elif latencia and latencia > UMBRAL_LATENCIA:
            nuevo_estado = "degradado"
            
        ultima_verificacion = datetime.now(timezone.utc)
        
        # Actualizar en BD
        dispositivos_col.update_one(
            {"_id": dispositivo_id},
            {
                "$set": {
                    "estado": nuevo_estado,
                    "latencia_actual": latencia,
                    "ultima_verificacion": ultima_verificacion
                }
            }
        )
        
        # Emitir evento
        await sio.emit('dispositivo_estado', {
            "id": str(dispositivo_id),
            "estado": nuevo_estado,
            "latencia": latencia,
            "ultima_verificacion": ultima_verificacion.isoformat()
        })
        
        # Alertas por cambio de estado
        if estado_anterior != nuevo_estado:
            alerta = None
            if nuevo_estado == "inactivo":
                alerta = {
                    "mensaje": f"Dispositivo {nombre} ({ip}) no responde al ping.",
                    "nivel": "critico",
                    "dispositivo_id": dispositivo_id,
                    "tipo_evento": "caida",
                    "valor_detectado": 0,
                    "umbral_configurado": 1,
                    "reconocida": False,
                    "reconocida_por": None,
                    "fecha_generacion": datetime.now(timezone.utc),
                    "fecha_reconocimiento": None
                }
            elif nuevo_estado == "degradado":
                alerta = {
                    "mensaje": f"Latencia alta en {nombre}: {latencia}ms (umbral: {UMBRAL_LATENCIA}ms).",
                    "nivel": "advertencia",
                    "dispositivo_id": dispositivo_id,
                    "tipo_evento": "latencia_alta",
                    "valor_detectado": latencia,
                    "umbral_configurado": UMBRAL_LATENCIA,
                    "reconocida": False,
                    "reconocida_por": None,
                    "fecha_generacion": datetime.now(timezone.utc),
                    "fecha_reconocimiento": None
                }
            elif estado_anterior == "inactivo" and nuevo_estado == "activo" and con_alerta_recuperacion:
                alerta = {
                    "mensaje": f"Dispositivo {nombre} recuperado. Latencia: {latencia}ms.",
                    "nivel": "informacion",
                    "dispositivo_id": dispositivo_id,
                    "tipo_evento": "recuperacion",
                    "valor_detectado": latencia,
                    "umbral_configurado": UMBRAL_LATENCIA,
                    "reconocida": False,
                    "reconocida_por": None,
                    "fecha_generacion": datetime.now(timezone.utc),
                    "fecha_reconocimiento": None
                }
            
            if alerta:
                res = alertas_col.insert_one(alerta)
                alerta["_id"] = str(res.inserted_id)
                alerta["dispositivo_id"] = str(alerta["dispositivo_id"])
                alerta["fecha_generacion"] = alerta["fecha_generacion"].isoformat()
                
                await sio.emit('nueva_alerta', alerta)
                
    except Exception as e:
        print(f"Error al verificar {dispositivo.get('nombre')}: {e}")

async def monitorear_ciclo():
    print("Servicio de monitoreo de red en tiempo real iniciado.")
    # Ciclo infinito
    while True:
        try:
            dispositivos = list(dispositivos_col.find({"estado": {"$ne": "sin_monitoreo"}}))
            tasks = [verificar_dispositivo(d) for d in dispositivos]
            if tasks:
                await asyncio.gather(*tasks)
        except Exception as e:
            print(f"Error en el ciclo de monitoreo: {e}")
        
        await asyncio.sleep(60)

def iniciar_monitoreo():
    asyncio.create_task(monitorear_ciclo())
