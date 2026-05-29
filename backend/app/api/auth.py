from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..db.dependencies import get_db
from ..core.security import verify_password, create_access_token
from ..schemas.auth import SolicitudAccesoCreate
from ..services.log_service import registrar_log
from ..services.notification_service import notificar_administradores
from ..models.models import Usuario, SolicitudAcceso, UsuarioBloqueado
from ..core.deps import get_current_user


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(Usuario).filter(
        Usuario.username == form_data.username
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Usuario no existe")

    # Verificar si el usuario está bloqueado por número de identificación
    blocked = db.query(UsuarioBloqueado).filter(UsuarioBloqueado.numero_identificacion == user.numero_identificacion).first()
    if blocked:
        raise HTTPException(status_code=403, detail="Su acceso ha sido denegado por un administrador")

    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Credenciales inválidas")

    # Registrar log de inicio de sesión
    registrar_log(db, user.id, "ACCESO", "Inicio de sesión", "Inicio de sesión exitoso")

    token = create_access_token({
        "sub": str(user.id),
        "rol": user.rol_id
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@router.post("/request-access")
def request_access(
    data: SolicitudAccesoCreate,
    db: Session = Depends(get_db)
):
    # Verificar si ya existe una solicitud con ese número de identificación
    exists = db.query(SolicitudAcceso).filter(SolicitudAcceso.numero_identificacion == data.numero_identificacion).first()
    if exists:
        raise HTTPException(status_code=400, detail="Ya existe una solicitud con este número de identificación")

    # Verificar si está bloqueado
    is_blocked = db.query(UsuarioBloqueado).filter(UsuarioBloqueado.numero_identificacion == data.numero_identificacion).first()
    if is_blocked:
        raise HTTPException(status_code=403, detail="Su solicitud de acceso ha sido denegada permanentemente")

    solicitud = SolicitudAcceso(**data.dict())
    db.add(solicitud)
    db.commit()

    # Notificar a administradores
    notificar_administradores(db, f"Nueva solicitud de acceso de {data.primer_nombre} {data.primer_apellido} ({data.numero_identificacion})")

    # Registrar log de solicitud de acceso
    registrar_log(db, None, "SOLICITUDES", "Solicitud de acceso recibida", f"Nueva solicitud de acceso de {data.primer_nombre} {data.primer_apellido}")

    return {"message": "Solicitud recibida exitosamente"}

@router.get("/requests")
def get_pending_requests(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Solo admin y coordinador
    if not current_user.rol or current_user.rol.nombre.upper() not in ["ADMINISTRADOR", "COORDINADOR DE SISTEMAS"]:
        raise HTTPException(status_code=403, detail="No tiene permisos")
        
    return db.query(SolicitudAcceso).filter(SolicitudAcceso.estado == "PENDIENTE").all()

@router.post("/requests/{id}/deny")
def deny_request(
    id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if not current_user.rol or current_user.rol.nombre.upper() not in ["ADMINISTRADOR", "COORDINADOR DE SISTEMAS"]:
        raise HTTPException(status_code=403, detail="No tiene permisos")

    solicitud = db.query(SolicitudAcceso).filter(SolicitudAcceso.id == id).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        
    # Crear registro en usuarios_bloqueados
    bloqueado = UsuarioBloqueado(
        primer_nombre=solicitud.primer_nombre,
        segundo_nombre=solicitud.segundo_nombre,
        primer_apellido=solicitud.primer_apellido,
        segundo_apellido=solicitud.segundo_apellido,
        tipo_identificacion=solicitud.tipo_identificacion,
        numero_identificacion=solicitud.numero_identificacion,
        correo_personal=solicitud.correo_personal,
        correo_institucional=solicitud.correo_institucional,
        celular=solicitud.celular,
        cargo=solicitud.cargo_solicitado,
        motivo="Denegado desde solicitudes de acceso"
    )
    
    solicitud.estado = "RECHAZADA"
    db.add(bloqueado)
    db.commit()
    
    registrar_log(db, current_user.id, "SOLICITUDES", "Solicitud Denegada", f"Se denegó el acceso a {solicitud.primer_nombre} {solicitud.primer_apellido}")
    
    return {"message": "Solicitud denegada y usuario bloqueado"}

@router.get("/blocked")
def get_blocked_users(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if not current_user.rol or current_user.rol.nombre.upper() not in ["ADMINISTRADOR", "COORDINADOR DE SISTEMAS"]:
        raise HTTPException(status_code=403, detail="No tiene permisos")

    return db.query(UsuarioBloqueado).all()

@router.delete("/blocked/{id}")
def unblock_user(
    id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if not current_user.rol or current_user.rol.nombre.upper() not in ["ADMINISTRADOR", "COORDINADOR DE SISTEMAS"]:
        raise HTTPException(status_code=403, detail="No tiene permisos")

    blocked = db.query(UsuarioBloqueado).filter(UsuarioBloqueado.id == id).first()
    if not blocked:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    db.delete(blocked)
    db.commit()
    
    registrar_log(db, current_user.id, "USUARIOS", "Usuario Desbloqueado", f"Se desbloqueó el acceso a {blocked.primer_nombre} {blocked.primer_apellido}")
    
    return {"message": "Usuario desbloqueado"}
