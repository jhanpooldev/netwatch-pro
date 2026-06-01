from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.database import usuarios_col
from app.auth import verify_password, create_access_token, get_current_user
from app.utils import serialize_doc
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    correo: str
    password: str

@router.post("/login")
def login(req_data: LoginRequest):
    correo_lower = req_data.correo.lower().strip()
    usuario = usuarios_col.find_one({"correo": correo_lower})

    if not usuario:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas.")

    if not usuario.get("activo", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta inactiva. Contacta al administrador.")

    if not verify_password(req_data.password, usuario.get("password_hash")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas.")

    # Actualizar último acceso
    usuarios_col.update_one(
        {"_id": usuario["_id"]},
        {"$set": {"ultimo_acceso": datetime.now(timezone.utc)}}
    )

    user_id = str(usuario["_id"])
    token = create_access_token({
        "id": user_id,
        "nombre": usuario.get("nombre"),
        "correo": usuario.get("correo"),
        "rol": usuario.get("rol")
    })

    return {
        "token": token,
        "usuario": {
            "id": user_id,
            "nombre": usuario.get("nombre"),
            "correo": usuario.get("correo"),
            "rol": usuario.get("rol")
        }
    }

@router.get("/perfil")
def perfil(current_user: dict = Depends(get_current_user)):
    try:
        user_id = ObjectId(current_user["id"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID de usuario inválido en el token.")

    usuario = usuarios_col.find_one({"_id": user_id})
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    serialized = serialize_doc(usuario)
    if "password_hash" in serialized:
        del serialized["password_hash"]

    # Agregar el campo id para compatibilidad frontend
    serialized["id"] = str(usuario["_id"])
    return serialized
