from bson import ObjectId
from datetime import datetime
from app.database import dispositivos_col, usuarios_col, alertas_col

def serialize_doc(doc) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            doc[k] = str(v)
        elif isinstance(v, datetime):
            # Formato estándar de fecha ISO 8601
            doc[k] = v.isoformat()
        elif isinstance(v, list):
            doc[k] = [serialize_doc(x) if isinstance(x, dict) else (str(x) if isinstance(x, ObjectId) else x) for x in v]
        elif isinstance(v, dict):
            doc[k] = serialize_doc(v)
    return doc

def populate_dispositivo(dispositivo_id):
    if not dispositivo_id:
        return None
    try:
        oid = ObjectId(dispositivo_id) if isinstance(dispositivo_id, str) else dispositivo_id
        disp = dispositivos_col.find_one({"_id": oid})
        if disp:
            return {"_id": str(disp["_id"]), "nombre": disp.get("nombre"), "ip_address": disp.get("ip_address")}
    except Exception:
        pass
    return None

def populate_tecnico(tecnico_id):
    if not tecnico_id:
        return None
    try:
        oid = ObjectId(tecnico_id) if isinstance(tecnico_id, str) else tecnico_id
        tec = usuarios_col.find_one({"_id": oid})
        if tec:
            return {"_id": str(tec["_id"]), "nombre": tec.get("nombre"), "correo": tec.get("correo")}
    except Exception:
        pass
    return None

def populate_alerta(alerta_id):
    if not alerta_id:
        return None
    try:
        oid = ObjectId(alerta_id) if isinstance(alerta_id, str) else alerta_id
        alert = alertas_col.find_one({"_id": oid})
        if alert:
            return serialize_doc(alert)
    except Exception:
        pass
    return None

def populate_usuario_short(usuario_id):
    if not usuario_id:
        return None
    try:
        oid = ObjectId(usuario_id) if isinstance(usuario_id, str) else usuario_id
        user = usuarios_col.find_one({"_id": oid})
        if user:
            return {"_id": str(user["_id"]), "nombre": user.get("nombre")}
    except Exception:
        pass
    return None
