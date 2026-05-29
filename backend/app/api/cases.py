from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.schemas.observation import ObservacionCreate
from app.services.case_service import crear_caso, agregar_observacion, finalizar_caso, ver_detalle_caso
from app.db.dependencies import get_db
from app.schemas.case import CasoCreate, CasoResponse, CasoDetailResponse
from app.core.deps import get_current_user
from app.models.models import Caso, Prioridad

router = APIRouter(prefix="/cases", tags=["Cases"])

@router.get("/priorities")
def get_priorities(db: Session = Depends(get_db)):
    return db.query(Prioridad).all()


from sqlalchemy.orm import joinedload

@router.get("/", response_model=List[CasoResponse])
def get_cases(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    casos = db.query(Caso).options(
        joinedload(Caso.estado),
        joinedload(Caso.prioridad),
        joinedload(Caso.cola),
        joinedload(Caso.usuario_asignado),
        joinedload(Caso.usuario_asignador)
    ).all()
    for c in casos:
        c.estado_nombre = c.estado.nombre if c.estado else None
        c.prioridad_nombre = c.prioridad.nombre if c.prioridad else None
        c.cola_nombre = c.cola.nombre if c.cola else None
        if c.usuario_asignado:
            c.asignado_a_nombre = f"{c.usuario_asignado.primer_nombre} {c.usuario_asignado.primer_apellido}"
        if c.usuario_asignador:
            c.asignado_por_nombre = f"{c.usuario_asignador.primer_nombre} {c.usuario_asignador.primer_apellido}"
    return casos


@router.get("/{caso_id}", response_model=CasoDetailResponse)
async def get_case(
    caso_id: uuid.UUID,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    caso = await ver_detalle_caso(db, str(caso_id), user)
    if not caso:
        raise HTTPException(status_code=404, detail="Caso no encontrado")
    
    # Enriquecer datos
    caso.estado_nombre = caso.estado.nombre if caso.estado else None
    caso.prioridad_nombre = caso.prioridad.nombre if caso.prioridad else None
    caso.cola_nombre = caso.cola.nombre if caso.cola else None
    
    if caso.usuario_asignado:
        caso.asignado_a_nombre = f"{caso.usuario_asignado.primer_nombre} {caso.usuario_asignado.primer_apellido}"
    if caso.usuario_asignador:
        caso.asignado_por_nombre = f"{caso.usuario_asignador.primer_nombre} {caso.usuario_asignador.primer_apellido}"
        
    # Enriquecer observaciones con nombres de usuario
    for obs in caso.observaciones:
        if obs.usuario:
            obs.usuario_nombre = f"{obs.usuario.primer_nombre} {obs.usuario.primer_apellido}"
            
    # Conteo de notificaciones (WhatsApp enviadas para este caso/usuario)
    # Como no hay relación directa Caso->Notificacion en el modelo, usamos el usuario asignado
    from app.models.models import Notificacion
    caso.total_notificaciones = db.query(Notificacion).filter(
        Notificacion.usuario_id == caso.asignado_a,
        Notificacion.estado == "ENVIADO"
    ).count()

    return caso


@router.post("/", response_model=CasoResponse)
async def create_case(
    data: CasoCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return await crear_caso(db, data, user)

@router.post("/observacion")
async def add_observation(
    data: ObservacionCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return await agregar_observacion(db, data, user)


@router.post("/finalizar/{caso_id}")
async def close_case(
    caso_id: uuid.UUID,
    comentario: str,
    enviar_correo: bool = False,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return await finalizar_caso(db, str(caso_id), comentario, user, enviar_correo)


@router.put("/{caso_id}/priority")
async def update_case_priority(
    caso_id: uuid.UUID,
    prioridad_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    from app.services.case_service import actualizar_prioridad_caso
    return await actualizar_prioridad_caso(db, str(caso_id), prioridad_id, user)
