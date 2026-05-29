from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.dependencies import get_db
from app.core.deps import get_current_user
from app.models.models import Caso, Usuario, Log, Estado

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # 1. Usuarios activos
    active_users = db.query(Usuario).filter(Usuario.estado == "ACTIVO").count()
    
    # 2. Casos (KPI Principal solicitado)
    total_cases = db.query(Caso).count()
    
    # Distribución de estados
    cases_by_status = db.query(
        Estado.nombre, 
        func.count(Caso.id).label('total')
    ).outerjoin(Caso, Estado.id == Caso.estado_id).group_by(Estado.nombre).all()
    
    status_distribution = [{"name": c[0], "value": c[1]} for c in cases_by_status]

    # Activos y Pendientes
    active_cases = sum([c['value'] for c in status_distribution if c['name'].lower() != 'finalizado'])
    pending_cases = sum([c['value'] for c in status_distribution if c['name'].lower() in ['asignado', 'en observacion']])


    # 3. Observaciones recientes (últimas 5)
    from app.models.models import Observacion, Prioridad
    from sqlalchemy.orm import joinedload
    
    recent_obs_query = db.query(Observacion)\
        .options(
            joinedload(Observacion.caso).joinedload(Caso.estado),
            joinedload(Observacion.caso).joinedload(Caso.prioridad),
            joinedload(Observacion.usuario)
        )\
        .order_by(Observacion.created_at.desc()).limit(5).all()
    
    recent_observations = []
    for obs in recent_obs_query:
        recent_observations.append({
            "id": str(obs.id),
            "case_number": obs.caso.numero_caso,
            "user_name": f"{obs.usuario.primer_nombre} {obs.usuario.primer_apellido}",
            "status": obs.caso.estado.nombre,
            "priority": obs.caso.prioridad.nombre,
            "date_time": obs.created_at.strftime("%d/%m/%Y %I:%M %p"),
            "comment": obs.comentario
        })


    # Si el usuario NO es admin/coordinador, enviamos sus estadísticas personales
    technician_stats = None
    if user.rol_id == 3: # Asumiendo que 3 es Tecnico
        tech_cases = db.query(
            Estado.nombre, 
            func.count(Caso.id).label('total')
        ).join(Caso, Estado.id == Caso.estado_id)\
         .filter(Caso.asignado_a == user.id)\
         .group_by(Estado.nombre).all()
        
        technician_stats = {c[0].lower(): c[1] for c in tech_cases}

    return {
        "users": {
            "active": active_users,
            "total_cases": total_cases
        },
        "cases": {
            "active": active_cases,
            "pending": pending_cases,
            "total": total_cases,
            "distribution": status_distribution
        },
        "recentObservations": recent_observations,
        "technicianStats": technician_stats
    }
