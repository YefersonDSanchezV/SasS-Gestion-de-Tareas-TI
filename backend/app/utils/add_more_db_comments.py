from sqlalchemy import text
from app.db.database import engine

def add_comments():
    comments = {
        "historial_estados": {
            "id": "Identificador único del registro de historial",
            "caso_id": "ID del caso que cambió de estado",
            "estado_id": "ID del nuevo estado asignado",
            "usuario_id": "ID del usuario que realizó el cambio",
            "fecha": "Fecha y hora del cambio de estado"
        },
        "logs": {
            "id": "Identificador único del log",
            "usuario_id": "ID del usuario que realizó la acción",
            "modulo": "Nombre del módulo donde se realizó la acción",
            "accion": "Tipo de acción (Crear, Editar, Eliminar, Login, etc)",
            "descripcion": "Descripción detallada de la acción realizada",
            "created_at": "Fecha y hora del evento",
            "ip": "Dirección IP desde la cual se realizó la acción",
            "user_agent": "Información del navegador/dispositivo del usuario"
        },
        "notificaciones": {
            "id": "Identificador único de la notificación",
            "usuario_id": "ID del usuario que recibe la notificación",
            "mensaje": "Contenido de la notificación",
            "leido": "Indica si el usuario ya vio la notificación",
            "created_at": "Fecha de creación",
            "canal": "Canal de envío (SISTEMA, WHATSAPP, EMAIL)",
            "destinatario": "Dato de contacto (teléfono o correo)",
            "estado": "Estado del envío (PENDIENTE, ENVIADO, ERROR)",
            "respuesta_provider": "Respuesta técnica del proveedor de mensajería",
            "enviado_at": "Fecha y hora real del envío"
        },
        "observaciones": {
            "id": "Identificador único de la observación",
            "caso_id": "ID del caso al que pertenece la observación",
            "usuario_id": "ID del usuario que escribió la observación",
            "comentario": "Contenido de la observación o nota técnica",
            "created_at": "Fecha de creación",
            "enviado_por_correo": "Indica si esta nota se notificó por correo al cliente"
        },
        "permisos_asignacion": {
            "id": "Identificador del permiso",
            "rol_origen_id": "ID del rol que puede realizar la acción",
            "rol_destino_id": "ID del rol sobre el cual se actúa",
            "accion": "Acción permitida (ej: asignar, ver_detalle)"
        }
    }

    with engine.connect() as conn:
        for table, cols in comments.items():
            for col, comment in cols.items():
                try:
                    # SQL para agregar comentario a la columna
                    query = f"COMMENT ON COLUMN {table}.{col} IS '{comment}';"
                    conn.execute(text(query))
                    conn.commit()
                    print(f"✅ Comentario añadido a {table}.{col}")
                except Exception as e:
                    print(f"⚠️ No se pudo añadir comentario a {table}.{col}: {str(e)[:100]}...")
                    conn.rollback()

if __name__ == "__main__":
    add_comments()
