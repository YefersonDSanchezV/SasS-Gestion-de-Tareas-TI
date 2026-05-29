from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db.dependencies import get_db
from ..core.deps import get_current_user, require_roles
from ..models.models import Rol
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/roles", tags=["Roles"])

class RolBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    estado: str = "ACTIVO"

class RolCreate(RolBase):
    pass

class RolResponse(RolBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[RolResponse])
def get_roles(
    db: Session = Depends(get_db),
    user = Depends(require_roles(1)) # Solo admin
):
    return db.query(Rol).all()

@router.post("/", response_model=RolResponse, status_code=status.HTTP_201_CREATED)
def create_rol(
    rol_in: RolCreate,
    db: Session = Depends(get_db),
    user = Depends(require_roles(1))
):
    if db.query(Rol).filter(Rol.nombre == rol_in.nombre).first():
        raise HTTPException(status_code=400, detail="El nombre del rol ya existe")
    
    nuevo_rol = Rol(**rol_in.dict())
    db.add(nuevo_rol)
    db.commit()
    db.refresh(nuevo_rol)
    
    from ..services.log_service import registrar_log
    registrar_log(db, user.id, "CONFIGURACION", "Creación de Rol", f"Se creó el rol: {nuevo_rol.nombre}")
    
    return nuevo_rol

@router.put("/{rol_id}", response_model=RolResponse)
def update_rol(
    rol_id: int,
    rol_in: RolCreate,
    db: Session = Depends(get_db),
    user = Depends(require_roles(1))
):
    db_rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not db_rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    old_estado = db_rol.estado
    for key, value in rol_in.dict().items():
        setattr(db_rol, key, value)
    
    db.commit()
    db.refresh(db_rol)
    
    from ..services.log_service import registrar_log
    registrar_log(db, user.id, "CONFIGURACION", "Actualización de Rol", f"Se actualizó el rol: {db_rol.nombre}")
    
    if old_estado != db_rol.estado:
        accion = "Rol Activado" if db_rol.estado == "ACTIVO" else "Rol Desactivado"
        registrar_log(db, user.id, "CONFIGURACION", accion, f"El estado del rol {db_rol.nombre} cambió a {db_rol.estado}")
        
    return db_rol
