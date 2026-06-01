from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone
from app.database import usuarios_col
from app.auth import get_current_user, hash_password
from app.utils import serialize_doc

router = APIRouter(prefix="/api/usuarios", tags=["usuarios"])

ROLES_VALIDOS = ["admin", "tecnico", "observador"]


def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("rol") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden realizar esta acción."
        )
    return current_user


class UsuarioCreate(BaseModel):
    nombre: str
    correo: str
    password: str
    rol: str = "tecnico"
    activo: bool = True


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    correo: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None
    password: Optional[str] = None


@router.get("/")
def listar(current_user: dict = Depends(require_admin)):
    usuarios = list(usuarios_col.find().sort("created_at", -1))
    result = []
    for u in usuarios:
        s = serialize_doc(u)
        s.pop("password_hash", None)
        result.append(s)
    return result


@router.get("/{id}")
def obtener(id: str, current_user: dict = Depends(require_admin)):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID inválido.")

    usuario = usuarios_col.find_one({"_id": oid})
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    s = serialize_doc(usuario)
    s.pop("password_hash", None)
    return s


@router.post("/", status_code=201)
def crear(data: UsuarioCreate, current_user: dict = Depends(require_admin)):
    if data.rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Rol inválido. Usa: {', '.join(ROLES_VALIDOS)}")

    correo_lower = data.correo.lower().strip()
    if usuarios_col.find_one({"correo": correo_lower}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un usuario con ese correo.")

    doc = {
        "nombre": data.nombre.strip(),
        "correo": correo_lower,
        "password_hash": hash_password(data.password),
        "rol": data.rol,
        "activo": data.activo,
        "ultimo_acceso": None,
        "created_at": datetime.now(timezone.utc)
    }
    res = usuarios_col.insert_one(doc)
    doc["_id"] = res.inserted_id
    s = serialize_doc(doc)
    s.pop("password_hash", None)
    return s


@router.put("/{id}")
def actualizar(id: str, data: UsuarioUpdate, current_user: dict = Depends(require_admin)):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID inválido.")

    # No se puede auto-desactivar ni cambiar su propio rol
    if str(oid) == current_user.get("id") and data.activo is False:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes desactivar tu propia cuenta.")

    update = {}
    if data.nombre is not None:
        update["nombre"] = data.nombre.strip()
    if data.correo is not None:
        correo_lower = data.correo.lower().strip()
        existing = usuarios_col.find_one({"correo": correo_lower, "_id": {"$ne": oid}})
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un usuario con ese correo.")
        update["correo"] = correo_lower
    if data.rol is not None:
        if data.rol not in ROLES_VALIDOS:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Rol inválido.")
        update["rol"] = data.rol
    if data.activo is not None:
        update["activo"] = data.activo
    if data.password:
        update["password_hash"] = hash_password(data.password)

    if not update:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay campos para actualizar.")

    from pymongo import ReturnDocument
    res = usuarios_col.find_one_and_update(
        {"_id": oid},
        {"$set": update},
        return_document=ReturnDocument.AFTER
    )
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    s = serialize_doc(res)
    s.pop("password_hash", None)
    return s


@router.delete("/{id}")
def eliminar(id: str, current_user: dict = Depends(require_admin)):
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID inválido.")

    if str(oid) == current_user.get("id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes eliminar tu propia cuenta.")

    res = usuarios_col.find_one_and_delete({"_id": oid})
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    return {"mensaje": "Usuario eliminado correctamente."}
