from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"

class SolicitudAccesoCreate(BaseModel):
    primer_nombre: str
    segundo_nombre: str = None
    primer_apellido: str
    segundo_apellido: str = None
    tipo_identificacion: str
    numero_identificacion: str
    correo_personal: str
    correo_institucional: str
    celular: str
    cargo_solicitado: str = None