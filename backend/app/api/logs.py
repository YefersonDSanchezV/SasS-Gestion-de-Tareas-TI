from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from ..db.dependencies import get_db
from ..models.models import Log, Usuario
from ..core.deps import get_current_user

router = APIRouter(prefix="/logs", tags=["Logs"])

@router.get("/")
def get_logs(
    modulo: str = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if not current_user.rol or current_user.rol.nombre.upper() not in ["ADMINISTRADOR", "COORDINADOR DE SISTEMAS"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="No tiene permisos")


    query = db.query(Log).options(joinedload(Log.usuario))
    
    if modulo:
        query = query.filter(Log.modulo == modulo)
        
    logs = query.order_by(Log.created_at.desc()).limit(100).all()
    
    return [
        {
            "id": str(log.id),
            "usuario": log.usuario.username if log.usuario else "Sistema",
            "accion": log.accion,
            "descripcion": log.descripcion,
            "created_at": log.created_at,
            "modulo": log.modulo
        }
        for log in logs
    ]
