from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone
from app.database import incidencias_col
from app.auth import get_current_user
from app.utils import (
    serialize_doc,
    populate_dispositivo,
    populate_tecnico,
    populate_alerta
)
from app.socket import sio

router = APIRouter(prefix="/api/incidencias", tags=["incidencias"])

class IncidenciaCrear(BaseModel):
    titulo: str
    descripcion: str
    dispositivo_id: Optional[str] = None
    prioridad: Optional[str] = "media"
    tecnico_id: Optional[str] = None
    alerta_id: Optional[str] = None

@router.get("/")
def listar(
    estado: Optional[str] = None,
    prioridad: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    filtro = {}
    if estado:
        filtro["estado"] = estado
    if prioridad:
        filtro["prioridad"] = prioridad

    total = incidencias_col.count_documents(filtro)
    cursor = incidencias_col.find(filtro).sort("fecha_apertura", -1).skip((page - 1) * limit).limit(limit)
    incidencias = list(cursor)

    serialized_incidencias = []
    for inc in incidencias:
        s_inc = serialize_doc(inc)
        s_inc["dispositivo_id"] = populate_dispositivo(inc.get("dispositivo_id"))
        s_inc["tecnico_id"] = populate_tecnico(inc.get("tecnico_id"))
        serialized_incidencias.append(s_inc)

    return {
        "total": total,
        "pagina": page,
        "limit": limit,
        "datos": serialized_incidencias
    }

@router.get("/estadisticas")
def estadisticas(current_user: dict = Depends(get_current_user)):
    total = incidencias_col.count_documents({})
    abiertas = incidencias_col.count_documents({"estado": "abierta"})
    en_progreso = incidencias_col.count_documents({"estado": "en_progreso"})
    resueltas = incidencias_col.count_documents({"estado": "resuelta"})
    criticas = incidencias_col.count_documents({
        "prioridad": "critica",
        "estado": {"$nin": ["resuelta", "cerrada"]}
    })
    return {
        "total": total,
        "abiertas": abiertas,
        "en_progreso": en_progreso,
        "resueltas": resueltas,
        "criticas": criticas
    }

@router.get("/{id}")
def obtener(id: str, current_user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID inválido.")

    incidencia = incidencias_col.find_one({"_id": oid})
    if not incidencia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incidencia no encontrada.")

    s_inc = serialize_doc(incidencia)
    s_inc["dispositivo_id"] = populate_dispositivo(incidencia.get("dispositivo_id"))
    s_inc["tecnico_id"] = populate_tecnico(incidencia.get("tecnico_id"))
    s_inc["alerta_id"] = populate_alerta(incidencia.get("alerta_id"))
    return s_inc

@router.post("/", status_code=201)
async def crear(inc_data: IncidenciaCrear, current_user: dict = Depends(get_current_user)):
    doc = inc_data.model_dump()

    if doc.get("dispositivo_id"):
        doc["dispositivo_id"] = ObjectId(doc["dispositivo_id"])
    if doc.get("tecnico_id"):
        doc["tecnico_id"] = ObjectId(doc["tecnico_id"])
    if doc.get("alerta_id"):
        doc["alerta_id"] = ObjectId(doc["alerta_id"])

    doc["estado"] = "abierta"
    doc["fecha_apertura"] = datetime.now(timezone.utc)
    doc["adjuntos"] = []
    
    doc["historial"] = [{
        "estado_anterior": None,
        "estado_nuevo": "abierta",
        "usuario_id": ObjectId(current_user["id"]),
        "comentario": "Incidencia creada.",
        "fecha": datetime.now(timezone.utc)
    }]

    res = incidencias_col.insert_one(doc)
    doc["_id"] = res.inserted_id

    serialized = serialize_doc(doc)
    serialized["dispositivo_id"] = populate_dispositivo(doc.get("dispositivo_id"))
    serialized["tecnico_id"] = populate_tecnico(doc.get("tecnico_id"))

    await sio.emit('incidencia_nueva', serialized)
    return serialized

@router.put("/{id}")
async def actualizar(id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID inválido.")

    incidencia = incidencias_col.find_one({"_id": oid})
    if not incidencia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incidencia no encontrada.")

    estado_anterior = incidencia.get("estado", "abierta")

    updates = {}
    for k, v in payload.items():
        if k in ["_id", "historial"]:
            continue
        if k == "dispositivo_id" and v:
            updates[k] = ObjectId(v) if isinstance(v, str) else v
        elif k == "tecnico_id" and v:
            updates[k] = ObjectId(v) if isinstance(v, str) else v
        elif k == "alerta_id" and v:
            updates[k] = ObjectId(v) if isinstance(v, str) else v
        else:
            updates[k] = v

    nuevo_estado = payload.get("estado")
    if nuevo_estado and nuevo_estado != estado_anterior:
        historial_item = {
            "estado_anterior": estado_anterior,
            "estado_nuevo": nuevo_estado,
            "usuario_id": ObjectId(current_user["id"]),
            "comentario": payload.get("comentario", "Estado actualizado."),
            "fecha": datetime.now(timezone.utc)
        }

        incidencias_col.update_one(
            {"_id": oid},
            {"$push": {"historial": historial_item}}
        )

        if nuevo_estado in ["resuelta", "cerrada"]:
            updates["fecha_cierre"] = datetime.now(timezone.utc)
            apertura = incidencia.get("fecha_apertura")
            if apertura:
                if apertura.tzinfo is None:
                    apertura = apertura.replace(tzinfo=timezone.utc)
                diff = updates["fecha_cierre"] - apertura
                updates["tiempo_resolucion"] = round(diff.total_seconds() / 60.0)

    if updates:
        incidencias_col.update_one({"_id": oid}, {"$set": updates})

    updated_doc = incidencias_col.find_one({"_id": oid})
    serialized = serialize_doc(updated_doc)
    serialized["dispositivo_id"] = populate_dispositivo(updated_doc.get("dispositivo_id"))
    serialized["tecnico_id"] = populate_tecnico(updated_doc.get("tecnico_id"))

    await sio.emit('incidencia_actualizada', serialized)
    return serialized

@router.delete("/{id}")
def eliminar(id: str, current_user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID inválido.")

    res = incidencias_col.find_one_and_delete({"_id": oid})
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incidencia no encontrada.")
    return {"mensaje": "Incidencia eliminada."}
