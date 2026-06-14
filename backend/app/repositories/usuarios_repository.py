from bson import ObjectId
from typing import List, Dict, Any, Optional
from app.database import usuarios_col

class UsuariosRepository:
    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        return list(usuarios_col.find().sort("created_at", -1))

    @staticmethod
    def get_by_id(user_id: ObjectId) -> Optional[Dict[str, Any]]:
        return usuarios_col.find_one({"_id": user_id})

    @staticmethod
    def get_by_correo(correo: str) -> Optional[Dict[str, Any]]:
        return usuarios_col.find_one({"correo": correo})

    @staticmethod
    def create(doc: Dict[str, Any]) -> ObjectId:
        res = usuarios_col.insert_one(doc)
        return res.inserted_id

    @staticmethod
    def update(user_id: ObjectId, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        from pymongo import ReturnDocument
        return usuarios_col.find_one_and_update(
            {"_id": user_id},
            {"$set": update_data},
            return_document=ReturnDocument.AFTER
        )

    @staticmethod
    def delete(user_id: ObjectId) -> Optional[Dict[str, Any]]:
        return usuarios_col.find_one_and_delete({"_id": user_id})
