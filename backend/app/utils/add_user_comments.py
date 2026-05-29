from sqlalchemy import text
from app.db.database import engine

def add_comments():
    schema = "saasgestiontickets"
    comments = {
        "prioridades": {
            "id": "Identificador de la prioridad",
            "nombre": "Nombre de la prioridad (Baja, Media, Alta, Crítica)"
        },
        "roles": {
            "id": "Identificador del rol",
            "nombre": "Nombre único del rol",
            "descripcion": "Descripción de las funciones del rol",
            "estado": "Estado del rol (ACTIVO/INACTIVO)",
            "created_at": "Fecha de creación del rol"
        },
        "solicitudes_acceso": {
            "id": "Identificador único de la solicitud",
            "primer_nombre": "Primer nombre del solicitante",
            "segundo_nombre": "Segundo nombre del solicitante",
            "primer_apellido": "Primer apellido del solicitante",
            "segundo_apellido": "Segundo apellido del solicitante",
            "tipo_identificacion": "Tipo de documento (CC, CE, etc)",
            "numero_identificacion": "Número de documento de identidad",
            "correo_personal": "Correo de contacto personal",
            "correo_institucional": "Correo asignado por la institución",
            "celular": "Número de teléfono móvil",
            "cargo_solicitado": "Cargo que el usuario solicita desempeñar",
            "estado": "Estado de la solicitud (PENDIENTE, APROBADA, RECHAZADA)",
            "created_at": "Fecha en que se realizó la solicitud"
        },
        "usuarios": {
            "id": "Identificador único del usuario (UUID)",
            "primer_nombre": "Primer nombre del usuario",
            "segundo_nombre": "Segundo nombre del usuario",
            "primer_apellido": "Primer apellido del usuario",
            "segundo_apellido": "Segundo apellido del usuario",
            "tipo_identificacion": "Tipo de documento del usuario",
            "numero_identificacion": "Número de documento del usuario",
            "celular": "Número de celular del usuario",
            "correo_personal": "Correo electrónico personal",
            "correo_institucional": "Correo electrónico institucional (Login)",
            "username": "Nombre de usuario único",
            "password_hash": "Hash de la contraseña (encriptado)",
            "rol_id": "ID del rol asignado (FK roles)",
            "estado": "Estado actual (ACTIVO, INACTIVO, BLOQUEADO)",
            "created_at": "Fecha de registro en el sistema"
        },
        "usuarios_bloqueados": {
            "id": "ID del registro de bloqueo",
            "primer_nombre": "Primer nombre del usuario bloqueado",
            "segundo_nombre": "Segundo nombre del usuario bloqueado",
            "primer_apellido": "Primer apellido del usuario bloqueado",
            "segundo_apellido": "Segundo apellido del usuario bloqueado",
            "tipo_identificacion": "Tipo de documento",
            "numero_identificacion": "Número de documento",
            "correo_personal": "Correo personal",
            "correo_institucional": "Correo institucional",
            "celular": "Número de celular",
            "cargo": "Cargo que tenía el usuario",
            "fecha_bloqueo": "Fecha y hora del bloqueo",
            "motivo": "Razón detallada por la cual se bloqueó al usuario"
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
