from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.database import configuracion_col
from app.auth import get_current_user
from app.utils import serialize_doc

router = APIRouter(prefix="/api/configuracion", tags=["configuracion"])

# ─── Defaults ────────────────────────────────────────────────────────────────
DEFAULTS_UMBRALES = {
    "tipo": "umbrales",
    "latencia_maxima_ms": 200,
    "perdida_paquetes_pct": 10,
    "intervalo_ping_defecto": 60,
    "alerta_recuperacion": True,
    "updated_at": None
}

DEFAULTS_SMTP = {
    "tipo": "smtp",
    "smtp_host": "",
    "smtp_port": 587,
    "smtp_usuario": "",
    "smtp_password": "",
    "smtp_tls": True,
    "destinatarios": [],
    "notificar_critico": True,
    "notificar_advertencia": True,
    "notificar_recuperacion": False,
    "updated_at": None
}


def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("rol") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden modificar la configuración."
        )
    return current_user


# ─── Umbrales ────────────────────────────────────────────────────────────────
class UmbralesUpdate(BaseModel):
    latencia_maxima_ms: Optional[int] = None
    perdida_paquetes_pct: Optional[float] = None
    intervalo_ping_defecto: Optional[int] = None
    alerta_recuperacion: Optional[bool] = None


@router.get("/umbrales")
def get_umbrales(current_user: dict = Depends(get_current_user)):
    doc = configuracion_col.find_one({"tipo": "umbrales"})
    if not doc:
        return DEFAULTS_UMBRALES
    return serialize_doc(doc)


@router.put("/umbrales")
def update_umbrales(data: UmbralesUpdate, current_user: dict = Depends(require_admin)):
    update = {"updated_at": datetime.now(timezone.utc)}
    if data.latencia_maxima_ms is not None:
        if data.latencia_maxima_ms < 1:
            raise HTTPException(status_code=400, detail="La latencia máxima debe ser mayor a 0 ms.")
        update["latencia_maxima_ms"] = data.latencia_maxima_ms
    if data.perdida_paquetes_pct is not None:
        if not (0 <= data.perdida_paquetes_pct <= 100):
            raise HTTPException(status_code=400, detail="El porcentaje debe estar entre 0 y 100.")
        update["perdida_paquetes_pct"] = data.perdida_paquetes_pct
    if data.intervalo_ping_defecto is not None:
        if data.intervalo_ping_defecto < 5:
            raise HTTPException(status_code=400, detail="El intervalo mínimo es 5 segundos.")
        update["intervalo_ping_defecto"] = data.intervalo_ping_defecto
    if data.alerta_recuperacion is not None:
        update["alerta_recuperacion"] = data.alerta_recuperacion

    from pymongo import ReturnDocument
    res = configuracion_col.find_one_and_update(
        {"tipo": "umbrales"},
        {"$set": update},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return serialize_doc(res)


# ─── SMTP ────────────────────────────────────────────────────────────────────
class SmtpUpdate(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_usuario: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_tls: Optional[bool] = None
    destinatarios: Optional[list] = None
    notificar_critico: Optional[bool] = None
    notificar_advertencia: Optional[bool] = None
    notificar_recuperacion: Optional[bool] = None


@router.get("/smtp")
def get_smtp(current_user: dict = Depends(require_admin)):
    doc = configuracion_col.find_one({"tipo": "smtp"})
    if not doc:
        return DEFAULTS_SMTP
    s = serialize_doc(doc)
    # Ocultar contraseña real en la respuesta
    if s.get("smtp_password"):
        s["smtp_password"] = "••••••••"
    return s


@router.put("/smtp")
def update_smtp(data: SmtpUpdate, current_user: dict = Depends(require_admin)):
    update = {"updated_at": datetime.now(timezone.utc)}
    campos = ["smtp_host", "smtp_port", "smtp_usuario", "smtp_password", "smtp_tls",
              "destinatarios", "notificar_critico", "notificar_advertencia", "notificar_recuperacion"]
    for campo in campos:
        val = getattr(data, campo)
        if val is not None:
            update[campo] = val

    if not update:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar.")

    from pymongo import ReturnDocument
    res = configuracion_col.find_one_and_update(
        {"tipo": "smtp"},
        {"$set": update},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    s = serialize_doc(res)
    if s.get("smtp_password"):
        s["smtp_password"] = "••••••••"
    return s


@router.post("/smtp/test")
async def test_smtp(background_tasks: BackgroundTasks, current_user: dict = Depends(require_admin)):
    """Envía un email de prueba con la configuración SMTP guardada."""
    doc = configuracion_col.find_one({"tipo": "smtp"})
    if not doc or not doc.get("smtp_host") or not doc.get("smtp_usuario"):
        raise HTTPException(status_code=400, detail="Configura primero el servidor SMTP antes de probar.")

    background_tasks.add_task(_enviar_email_prueba, doc)
    return {"mensaje": "Email de prueba enviado en segundo plano."}


def _enviar_email_prueba(config: dict):
    import smtplib
    from email.mime.text import MIMEText
    try:
        msg = MIMEText(
            "Este es un correo de prueba desde NetWatch Pro.\n\n"
            "Si recibes este mensaje, la configuración SMTP es correcta."
        )
        msg["Subject"] = "[NetWatch Pro] Prueba de configuración SMTP"
        msg["From"] = config.get("smtp_usuario", "netwatch@noreply.com")
        destinatarios = config.get("destinatarios", [])
        if not destinatarios:
            destinatarios = [config.get("smtp_usuario")]
        msg["To"] = ", ".join(destinatarios)

        host = config["smtp_host"]
        port = config.get("smtp_port", 587)
        user = config["smtp_usuario"]
        password = config.get("smtp_password", "")
        use_tls = config.get("smtp_tls", True)

        if use_tls:
            server = smtplib.SMTP(host, port, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP(host, port, timeout=10)

        if user and password:
            server.login(user, password)
        server.sendmail(user, destinatarios, msg.as_string())
        server.quit()
        print("Email de prueba enviado correctamente.")
    except Exception as e:
        print(f"Error al enviar email de prueba: {e}")
