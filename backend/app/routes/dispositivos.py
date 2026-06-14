from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone
from app.database import dispositivos_col
from app.auth import get_current_user
from app.utils import serialize_doc
from app.socket import sio

router = APIRouter(prefix="/api/dispositivos", tags=["dispositivos"])

class DispositivoBase(BaseModel):
    nombre: str
    ip_address: str
    mac_address: Optional[str] = ""
    tipo: Optional[str] = "otro"
    ubicacion: Optional[str] = ""
    estado: Optional[str] = "sin_monitoreo"
    latencia_actual: Optional[float] = None
    intervalo_ping: Optional[int] = 60

class DispositivoUpdate(BaseModel):
    nombre: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    tipo: Optional[str] = None
    ubicacion: Optional[str] = None
    estado: Optional[str] = None
    latencia_actual: Optional[float] = None
    intervalo_ping: Optional[int] = None

@router.get("/")
def listar(current_user: dict = Depends(get_current_user)):
    dispositivos = list(dispositivos_col.find().sort("created_at", -1))
    return [serialize_doc(d) for d in dispositivos]

@router.get("/estadisticas")
def estadisticas(current_user: dict = Depends(get_current_user)):
    total = dispositivos_col.count_documents({})
    activos = dispositivos_col.count_documents({"estado": "activo"})
    inactivos = dispositivos_col.count_documents({"estado": "inactivo"})
    degradados = dispositivos_col.count_documents({"estado": "degradado"})
    return {
        "total": total,
        "activos": activos,
        "inactivos": inactivos,
        "degradados": degradados
    }

@router.get("/{id}")
def obtener(id: str, current_user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID inválido.")

    dispositivo = dispositivos_col.find_one({"_id": oid})
    if not dispositivo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispositivo no encontrado.")
    return serialize_doc(dispositivo)

@router.post("/", status_code=201)
async def crear(disp_data: DispositivoBase, current_user: dict = Depends(get_current_user)):
    doc = disp_data.model_dump()
    doc["uptime_porcentaje"] = 100
    doc["ultima_verificacion"] = None
    doc["created_at"] = datetime.now(timezone.utc)

    res = dispositivos_col.insert_one(doc)
    doc["_id"] = res.inserted_id

    serialized = serialize_doc(doc)
    await sio.emit('dispositivo_nuevo', serialized)
    return serialized

@router.put("/{id}")
async def actualizar(id: str, disp_data: DispositivoUpdate, current_user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID inválido.")

    update_dict = disp_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay campos para actualizar.")

    from pymongo import ReturnDocument
    res = dispositivos_col.find_one_and_update(
        {"_id": oid},
        {"$set": update_dict},
        return_document=ReturnDocument.AFTER
    )
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispositivo no encontrado.")

    serialized = serialize_doc(res)
    await sio.emit('dispositivo_actualizado', serialized)
    return serialized

@router.delete("/{id}")
async def eliminar(id: str, current_user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID inválido.")

    res = dispositivos_col.find_one_and_delete({"_id": oid})
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispositivo no encontrado.")

    await sio.emit('dispositivo_eliminado', {"id": id})
    return {"mensaje": "Dispositivo eliminado correctamente."}
