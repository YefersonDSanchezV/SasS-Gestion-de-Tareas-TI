from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.models.models import Usuario

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


# 🔒 CONTROL POR ROLES
def require_roles(*roles_ids):
    def role_checker(user: Usuario = Depends(get_current_user)):
        if user.rol_id not in roles_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción",
            )
        return user

    return role_checker