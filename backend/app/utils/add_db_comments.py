from sqlalchemy import text
from app.db.database import engine

def add_comments():
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
        }
    }

    with engine.connect() as conn:
        for table, cols in comments.items():
            for col, comment in cols.items():
                try:
                    # SQL para agregar comentario a la columna
                    query = f"COMMENT ON COLUMN {table}.{col} IS '{comment}';"
                    conn.execute(text(query))
                    conn.commit() # Commit tras cada cambio para evitar abortos de transacción
                    print(f"✅ Comentario añadido a {table}.{col}")
                except Exception as e:
                    print(f"⚠️ No se pudo añadir comentario a {table}.{col}: {str(e)[:100]}...")
                    # Iniciar nueva transacción tras error
                    conn.rollback()

if __name__ == "__main__":
    add_comments()
