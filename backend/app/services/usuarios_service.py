from bson import ObjectId
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from datetime import datetime, timezone

from app.repositories.usuarios_repository import UsuariosRepository
from app.auth import hash_password
from app.utils import serialize_doc

class UsuariosService:
    @staticmethod
    def listar_usuarios() -> List[Dict[str, Any]]:
        usuarios = UsuariosRepository.get_all()
        result = []
        for u in usuarios:
            s = serialize_doc(u)
            s.pop("password_hash", None)
            result.append(s)
        return result

    @staticmethod
    def obtener_usuario(user_id_str: str) -> Dict[str, Any]:
        try:
            oid = ObjectId(user_id_str)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID de usuario inválido.")
        
        usuario = UsuariosRepository.get_by_id(oid)
        if not usuario:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
        s = serialize_doc(usuario)
        s.pop("password_hash", None)
        return s

    @staticmethod
    def crear_usuario(payload: Dict[str, Any]) -> Dict[str, Any]:
        correo_lower = payload.get("correo").lower().strip()
        existente = UsuariosRepository.get_by_correo(correo_lower)
        if existente:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un usuario con ese correo."
            )

        doc = {
            "nombre": payload["nombre"].strip(),
            "correo": correo_lower,
            "password_hash": hash_password(payload["password"]),
            "rol": payload["rol"],
            "activo": payload.get("activo", True),
            "created_at": datetime.now(timezone.utc),
            "ultimo_acceso": None
        }

        inserted_id = UsuariosRepository.create(doc)
        doc["_id"] = inserted_id
        s = serialize_doc(doc)
        s.pop("password_hash", None)
        return s

    @staticmethod
    def actualizar_usuario(user_id_str: str, payload: Dict[str, Any], current_user_id: str) -> Dict[str, Any]:
        try:
            oid = ObjectId(user_id_str)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID de usuario inválido.")

        usuario = UsuariosRepository.get_by_id(oid)
        if not usuario:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

        # Si se actualiza el correo, verificar duplicados
        nuevo_correo = payload.get("correo")
        if nuevo_correo:
            correo_lower = nuevo_correo.lower().strip()
            existente = UsuariosRepository.get_by_correo(correo_lower)
            if existente and existente.get("_id") != oid:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe un usuario con ese correo."
                )
            payload["correo"] = correo_lower

        updates: Dict[str, Any] = {}
        if "nombre" in payload and payload["nombre"] is not None:
            updates["nombre"] = payload["nombre"].strip()
        if "correo" in payload and payload["correo"] is not None:
            updates["correo"] = payload["correo"]
        if "rol" in payload and payload["rol"] is not None:
            updates["rol"] = payload["rol"]
        if "activo" in payload and payload["activo"] is not None:
            updates["activo"] = payload["activo"]

        # Validación especial: no desactivar o degradar su propia cuenta de admin
        if user_id_str == current_user_id:
            if "activo" in updates and not updates["activo"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No puedes desactivar tu propia cuenta."
                )
            if "rol" in updates and updates["rol"] != "admin":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No puedes degradar tu propio rol de administrador."
                )

        new_pwd = payload.get("password")
        if new_pwd:
            updates["password_hash"] = hash_password(new_pwd)

        if not updates:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay campos para actualizar.")

        updated_user = UsuariosRepository.update(oid, updates)
        if not updated_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

        s = serialize_doc(updated_user)
        s.pop("password_hash", None)
        return s

    @staticmethod
    def eliminar_usuario(user_id_str: str, current_user_id: str) -> None:
        try:
            oid = ObjectId(user_id_str)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID de usuario inválido.")

        if user_id_str == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes eliminar tu propia cuenta."
            )

        res = UsuariosRepository.delete(oid)
        if not res:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
