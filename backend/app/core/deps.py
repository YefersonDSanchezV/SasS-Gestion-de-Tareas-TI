from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.models.models import Usuario, RolModuloPermiso, Modulo, Permiso

import os
from dotenv import load_dotenv

load_dotenv()

# ✅ CONFIG PRIMERO
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

# ✅ oauth2_scheme ANTES de usarse
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# 🔐 OBTENER USUARIO DESDE TOKEN
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(Usuario).filter(Usuario.id == user_id).first()

    if not user:
        raise credentials_exception

    return user


# 🔒 CONTROL POR ROLES (legacy - se mantiene para compatibilidad)
def require_roles(*roles_ids):
    def role_checker(user: Usuario = Depends(get_current_user)):
        if user.rol_id not in roles_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción",
            )
        return user

    return role_checker


# 🔒 CONTROL POR PERMISO DINÁMICO (nuevo)
def require_permission(modulo_nombre: str, accion: str = None):
    """
    Valida que el usuario tenga acceso al módulo indicado.
    Opcionalmente valida una acción específica (Agregar, Eliminar, etc.)
    Los administradores (rol_id=1) siempre tienen acceso total.
    """
    def permission_checker(
        user: Usuario = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        # Admin siempre tiene acceso completo
        if user.rol_id == 1:
            return user

        if not user.rol_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tienes permisos para acceder al módulo '{modulo_nombre}'",
            )

        # Buscar el módulo por nombre
        modulo = db.query(Modulo).filter(Modulo.nombre == modulo_nombre).first()
        if not modulo:
            # Si el módulo no existe en BD, solo admin puede acceder
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Módulo '{modulo_nombre}' no encontrado",
            )

        # Consultar si el rol tiene algún permiso sobre este módulo
        query = db.query(RolModuloPermiso).filter(
            RolModuloPermiso.rol_id == user.rol_id,
            RolModuloPermiso.modulo_id == modulo.id,
        )

        if accion:
            permiso = db.query(Permiso).filter(Permiso.nombre == accion).first()
            if permiso:
                query = query.filter(RolModuloPermiso.permiso_id == permiso.id)

        tiene_permiso = query.first()
        if not tiene_permiso:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tienes permiso para acceder a '{modulo_nombre}'",
            )

        return user

    return permission_checker