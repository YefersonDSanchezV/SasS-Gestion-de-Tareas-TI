from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.dependencies import get_db
from app.core.deps import get_current_user
from app.models.models import Notificacion

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    notifications = db.query(Notificacion).filter(
        Notificacion.usuario_id == user.id,
        Notificacion.canal == "APP"
    ).order_by(Notificacion.created_at.desc()).limit(20).all()
    
    return [
        {
            "id": str(n.id),
            "mensaje": n.mensaje,
            "leido": n.leido,
            "created_at": n.created_at
        }
        for n in notifications
    ]

@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    notification = db.query(Notificacion).filter(
        Notificacion.id == notification_id,
        Notificacion.usuario_id == user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    notification.leido = True
    db.commit()
    
    return {"message": "Notificación marcada como leída"}

@router.put("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    db.query(Notificacion).filter(
        Notificacion.usuario_id == user.id,
        Notificacion.canal == "APP",
        Notificacion.leido == False
    ).update({"leido": True})
    
    db.commit()
    
    return {"message": "Todas las notificaciones marcadas como leídas"}
