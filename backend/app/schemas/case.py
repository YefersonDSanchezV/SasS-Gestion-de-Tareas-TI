from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ObservacionResponse(BaseModel):
    id: UUID
    comentario: str
    usuario_nombre: Optional[str] = None
    enviado_por_correo: bool = False
    created_at: datetime

    class Config:
        from_attributes = True



class CasoCreate(BaseModel):
    titulo: str
    descripcion: Optional[str]
    asignado_a: str
    prioridad_id: int
    cola_id: int


class CasoResponse(BaseModel):
    id: UUID
    numero_caso: str
    titulo: str
    descripcion: Optional[str]
    estado_id: Optional[int]
    estado_nombre: Optional[str] = None
    prioridad_id: Optional[int]
    prioridad_nombre: Optional[str] = None
    cola_id: Optional[int]
    cola_nombre: Optional[str] = None
    asignado_a: Optional[UUID]
    asignado_a_nombre: Optional[str] = None
    asignado_por: Optional[UUID]
    asignado_por_nombre: Optional[str] = None
    fecha_inicio: Optional[datetime]
    fecha_finalizacion: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CasoDetailResponse(CasoResponse):
    observaciones: List[ObservacionResponse] = []
    total_notificaciones: int = 0