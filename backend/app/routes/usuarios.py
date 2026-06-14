from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.auth import get_current_user
from app.services.usuarios_service import UsuariosService

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
    correo: EmailStr
    password: str
    rol: str = "tecnico"
    activo: bool = True

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    correo: Optional[EmailStr] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None
    password: Optional[str] = None

@router.get("/")
def listar(current_user: dict = Depends(require_admin)):
    return UsuariosService.listar_usuarios()

@router.get("/{id}")
def obtener(id: str, current_user: dict = Depends(require_admin)):
    return UsuariosService.obtener_usuario(id)

@router.post("/", status_code=201)
def crear(data: UsuarioCreate, current_user: dict = Depends(require_admin)):
    if data.rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Rol inválido. Usa: {', '.join(ROLES_VALIDOS)}")
    return UsuariosService.crear_usuario(data.model_dump())

@router.put("/{id}")
def actualizar(id: str, data: UsuarioUpdate, current_user: dict = Depends(require_admin)):
    if data.rol is not None and data.rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rol inválido.")
    return UsuariosService.actualizar_usuario(id, data.model_dump(exclude_unset=True), current_user.get("id"))

@router.delete("/{id}")
def eliminar(id: str, current_user: dict = Depends(require_admin)):
    UsuariosService.eliminar_usuario(id, current_user.get("id"))
    return {"mensaje": "Usuario eliminado correctamente."}
