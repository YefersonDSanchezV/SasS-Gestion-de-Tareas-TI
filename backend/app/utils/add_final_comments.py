from sqlalchemy import text
from app.db.database import engine

def add_comments():
    schema = "saasgestiontickets"
    comments = {
        "archivos": {
            "id": "Identificador único del archivo (UUID)",
            "caso_id": "ID del caso al que pertenece el archivo",
            "nombre": "Nombre original del archivo",
            "ruta": "Ruta de almacenamiento en el servidor",
            "tipo": "Tipo de archivo (MIME type)",
            "tamaño": "Tamaño del archivo en bytes",
            "created_at": "Fecha y hora de carga"
        },
        "casos": {
            "id": "Identificador único del caso",
            "numero_caso": "Número correlativo de seguimiento del caso",
            "titulo": "Título o asunto breve del caso",
            "descripcion": "Detalle extenso del problema o requerimiento",
            "asignado_a": "Usuario técnico encargado del caso",
            "asignado_por": "Usuario que creó o asignó el caso",
            "estado_id": "ID del estado actual (Pendiente, En Proceso, etc)",
            "prioridad_id": "ID de prioridad (Baja, Media, Alta, Crítica)",
            "cola_id": "ID de la cola o departamento responsable",
            "fecha_inicio": "Fecha en que se inició el trabajo en el caso",
            "fecha_finalizacion": "Fecha en que se cerró el caso",
            "sla_respuesta": "Tiempo límite de respuesta en minutos",
            "sla_resolucion": "Tiempo límite de resolución en minutos",
            "created_at": "Fecha de creación del registro",
            "updated_at": "Fecha de última actualización"
        },
        "colas": {
            "id": "Identificador de la cola",
            "nombre": "Nombre del departamento o cola de trabajo"
        },
        "correos": {
            "id": "Identificador del registro de correo",
            "message_id": "ID único del mensaje en el servidor de correo",
            "asunto": "Asunto del correo electrónico",
            "remitente": "Dirección de correo de quien envía",
            "destinatario": "Dirección de correo a quien se dirige",
            "cuerpo": "Contenido completo del mensaje",
            "fecha": "Fecha y hora de recepción/envío",
            "procesado": "Indica si el correo ya fue convertido en caso"
        },
        "estados": {
            "id": "Identificador del estado",
            "nombre": "Nombre visible del estado",
            "orden": "Orden jerárquico de visualización"
        },
        "usuarios": {
            "id": "Identificador único del usuario",
            "primer_nombre": "Primer nombre del usuario",
            "primer_apellido": "Primer apellido del usuario",
            "correo_institucional": "Correo electrónico oficial de la institución",
            "username": "Nombre de usuario para iniciar sesión",
            "rol_id": "ID del rol asignado",
            "estado": "Estado actual del usuario (ACTIVO/INACTIVO)"
        },
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
                    # SQL para agregar comentario a la columna con esquema explícito
                    query = f"COMMENT ON COLUMN {schema}.{table}.{col} IS '{comment}';"
                    conn.execute(text(query))
                    conn.commit()
                    print(f"✅ Comentario añadido a {schema}.{table}.{col}")
                except Exception as e:
                    print(f"⚠️ No se pudo añadir comentario a {schema}.{table}.{col}: {str(e)[:100]}...")
                    conn.rollback()

if __name__ == "__main__":
    add_comments()
