from pydantic import BaseModel

class ObservacionCreate(BaseModel):
    caso_id: str
    comentario: str
    enviar_correo: bool = False
