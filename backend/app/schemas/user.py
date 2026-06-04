from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    primer_nombre: str
    segundo_nombre: Optional[str] = None
    primer_apellido: str
    segundo_apellido: Optional[str] = None
    tipo_identificacion: Optional[str] = None
    numero_identificacion: Optional[str] = None
    celular: Optional[str] = None
    correo_personal: Optional[EmailStr] = None
    correo_institucional: EmailStr
    username: str

class UserCreateRequest(UserBase):
    password: str

class UserUpdate(BaseModel):
    primer_nombre: Optional[str] = None
    segundo_nombre: Optional[str] = None
    primer_apellido: Optional[str] = None
    segundo_apellido: Optional[str] = None
    tipo_identificacion: Optional[str] = None
    numero_identificacion: Optional[str] = None
    celular: Optional[str] = None
    correo_personal: Optional[EmailStr] = None
    rol_id: Optional[int] = None
    estado: Optional[str] = None

class UserResponse(UserBase):
    id: UUID
    rol_id: Optional[int] = None
    rol_nombre: Optional[str] = None
    estado: str
    created_at: datetime
    modulos_accesibles: Optional[List[str]] = []
    permisos_detalle: Optional[Dict[str, List[str]]] = {}

    class Config:
        from_attributes = True

class RolResponse(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True
