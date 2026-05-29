from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..db.dependencies import get_db
from ..core.deps import get_current_user, require_roles
from ..models.models import Usuario, Rol
from ..schemas.user import UserCreateRequest, UserResponse, UserUpdate, RolResponse
from ..core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["users"])

# 1. SOLICITUD DE ACCESO (Registro)
@router.post("/request-access", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def request_access(user_in: UserCreateRequest, db: Session = Depends(get_db)):
    # Verificar si el usuario o correo ya existen
    if db.query(Usuario).filter((Usuario.correo_institucional == user_in.correo_institucional) | (Usuario.username == user_in.username)).first():
        raise HTTPException(status_code=400, detail="El correo o nombre de usuario ya está registrado.")
    
    nuevo_usuario = Usuario(
        primer_nombre=user_in.primer_nombre,
        segundo_nombre=user_in.segundo_nombre,
        primer_apellido=user_in.primer_apellido,
        segundo_apellido=user_in.segundo_apellido,
        celular=user_in.celular,
        correo_personal=user_in.correo_personal,
        correo_institucional=user_in.correo_institucional,
        username=user_in.username,
        password_hash=get_password_hash(user_in.password),
        estado="INACTIVO" # IMPORTANTE: Nace inactivo hasta que un admin apruebe
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

# 2. OBTENER MI PERFIL
@router.get("/me", response_model=UserResponse)
def get_me(user = Depends(get_current_user)):
    user.rol_nombre = user.rol.nombre if user.rol else None
    return user

# 3. LISTAR USUARIOS (Solo admin y coordinador)
@router.get("/", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    user = Depends(require_roles(1,2)) # admin y coordinador
):
    usuarios = db.query(Usuario).all()
    for u in usuarios:
        u.rol_nombre = u.rol.nombre if u.rol else None
    return usuarios

# 4. OBTENER DETALLE DE USUARIO
@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    user = Depends(require_roles(1,2))
):
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db_user.rol_nombre = db_user.rol.nombre if db_user.rol else None
    return db_user

# 5. APROBAR USUARIO (Solo admin)
@router.put("/{user_id}/approve", response_model=UserResponse)
def approve_user(
    user_id: uuid.UUID,
    rol_id: int, # Al aprobar hay que asignarle un rol
    db: Session = Depends(get_db),
    user = Depends(require_roles(1)) # Solo admin (rol 1)
):
    from ..services.log_service import registrar_log
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db_rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if not db_rol:
        raise HTTPException(status_code=400, detail="El rol asignado no es válido")

    db_user.estado = "ACTIVO"
    db_user.rol_id = rol_id
    db.commit()
    db.refresh(db_user)

    registrar_log(db, user.id, "USUARIOS", "Usuario Aprobado", f"Se aprobó y activó al usuario {db_user.primer_nombre} {db_user.primer_apellido}")

    return db_user

# 6. EDITAR USUARIO
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    user = Depends(require_roles(1,2))
):
    from ..services.log_service import registrar_log
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    old_estado = db_user.estado
    update_data = user_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)

    # Log de actualización
    registrar_log(db, user.id, "USUARIOS", "Usuario Actualizado", f"Se actualizó la información de {db_user.primer_nombre} {db_user.primer_apellido}")
    
    # Log de cambio de estado
    if old_estado != db_user.estado:
        accion = "Usuario Activado" if db_user.estado == "ACTIVO" else "Usuario Inactivado"
        registrar_log(db, user.id, "USUARIOS", accion, f"El estado del usuario {db_user.primer_nombre} cambió de {old_estado} a {db_user.estado}")

    return db_user

# 7. LISTAR ROLES
@router.get("/roles/all", response_model=List[RolResponse])
def get_roles(
    db: Session = Depends(get_db),
    user = Depends(require_roles(1,2))
):
    return db.query(Rol).all()

# 8. ELIMINAR USUARIO (Solo admin)
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    user = Depends(require_roles(1))
):
    from ..services.log_service import registrar_log
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    nombre_completo = f"{db_user.primer_nombre} {db_user.primer_apellido}"
    db.delete(db_user)
    db.commit()

    registrar_log(db, user.id, "USUARIOS", "Usuario Eliminado", f"Se eliminó permanentemente al usuario {nombre_completo}")

    return None

# 9. CREAR USUARIO DIRECTO (Admin)
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_admin(
    user_in: UserCreateRequest, 
    rol_id: int,
    db: Session = Depends(get_db),
    user = Depends(require_roles(1))
):
    from ..services.log_service import registrar_log
    from ..models.models import UsuarioBloqueado

    # Validaciones solicitadas
    if db.query(Usuario).filter(Usuario.numero_identificacion == user_in.numero_identificacion).first():
        raise HTTPException(status_code=400, detail="Usuario con numero de identificacion ya existe")
    
    if db.query(Usuario).filter(Usuario.correo_personal == user_in.correo_personal).first():
        raise HTTPException(status_code=400, detail="Correo Personal ya existe")
    
    if not user_in.celular.startswith("+57"):
        raise HTTPException(status_code=400, detail="Ingrese al codigo de telefono nacional correspondiente (+57)")

    # El correo institucional SI se puede repetir (no se valida unicidad aquí)

    nuevo_usuario = Usuario(
        primer_nombre=user_in.primer_nombre,
        segundo_nombre=user_in.segundo_nombre,
        primer_apellido=user_in.primer_apellido,
        segundo_apellido=user_in.segundo_apellido,
        tipo_identificacion=user_in.tipo_identificacion,
        numero_identificacion=user_in.numero_identificacion,
        celular=user_in.celular,
        correo_personal=user_in.correo_personal,
        correo_institucional=user_in.correo_institucional,
        username=user_in.username,
        password_hash=get_password_hash(user_in.password),
        estado="ACTIVO",
        rol_id=rol_id
    )
    
    db.add(nuevo_usuario)

    # Si el usuario estaba bloqueado, lo eliminamos de la lista de bloqueados
    blocked = db.query(UsuarioBloqueado).filter(UsuarioBloqueado.numero_identificacion == user_in.numero_identificacion).first()
    if blocked:
        db.delete(blocked)

    db.commit()
    db.refresh(nuevo_usuario)

    registrar_log(db, user.id, "USUARIOS", "Usuario Creado", f"Se creó un nuevo usuario: {nuevo_usuario.primer_nombre} {nuevo_usuario.primer_apellido}")

    return nuevo_usuario


