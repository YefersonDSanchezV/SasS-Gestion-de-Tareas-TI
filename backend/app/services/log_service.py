from ..models.models import Log
from datetime import datetime


def registrar_log(
    db,
    usuario_id,
    modulo,
    accion,
    descripcion
):

    log = Log(
        usuario_id=usuario_id,
        modulo=modulo,
        accion=accion,
        descripcion=descripcion,
        created_at=datetime.now()
    )

    db.add(log)
    db.commit()