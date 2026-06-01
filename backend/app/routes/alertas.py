from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone
from app.database import alertas_col
from app.auth import get_current_user
from app.utils import serialize_doc, populate_dispositivo, populate_usuario_short
from app.socket import sio

router = APIRouter(prefix="/api/alertas", tags=["alertas"])

@router.get("/")
def listar(
    nivel: Optional[str] = None,
    reconocida: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    filtro = {}
    if nivel:
        filtro["nivel"] = nivel
    if reconocida is not None:
        filtro["reconocida"] = reconocida.lower() == "true"

    total = alertas_col.count_documents(filtro)
    cursor = alertas_col.find(filtro).sort("fecha_generacion", -1).skip((page - 1) * limit).limit(limit)
    alertas = list(cursor)

    serialized_alertas = []
    for alert in alertas:
        s_alert = serialize_doc(alert)
        s_alert["dispositivo_id"] = populate_dispositivo(alert.get("dispositivo_id"))
        s_alert["reconocida_por"] = populate_usuario_short(alert.get("reconocida_por"))
        serialized_alertas.append(s_alert)

    return {
        "total": total,
        "datos": serialized_alertas
    }

@router.get("/criticas")
def contar_criticas(current_user: dict = Depends(get_current_user)):
    count = alertas_col.count_documents({
        "nivel": "critico",
        "reconocida": False
    })
    return {"criticas_no_reconocidas": count}

@router.put("/{id}/reconocer")
async def reconocer(id: str, current_user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID inválido.")

    from pymongo import ReturnDocument
    res = alertas_col.find_one_and_update(
        {"_id": oid},
        {
            "$set": {
                "reconocida": True,
                "reconocida_por": ObjectId(current_user["id"]),
                "fecha_reconocimiento": datetime.now(timezone.utc)
            }
        },
        return_document=ReturnDocument.AFTER
    )
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta no encontrada.")

    await sio.emit('alerta_reconocida', {"id": id})
    return serialize_doc(res)
