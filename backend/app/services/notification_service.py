from twilio.rest import Client
from datetime import datetime

from app.core.config import settings
from app.models.models import Notificacion
from app.services.log_service import registrar_log

client = Client(
    settings.TWILIO_ACCOUNT_SID,
    settings.TWILIO_AUTH_TOKEN
)


def formatear_numero(numero: str):
    if not numero:
        return None

    numero = str(numero).strip().replace(" ", "")


    if numero.startswith("+"):
        return numero

    if len(numero) == 10:
        return f"+57{numero}"

    return None


def enviar_whatsapp(db, usuario, mensaje):

    numero = formatear_numero(usuario.celular)

    if not numero:
        print("⛔ Número inválido")

        notif = Notificacion(
            usuario_id=usuario.id,
            canal="WHATSAPP",
            destinatario=usuario.celular,
            mensaje=mensaje,
            estado="ERROR",
            respuesta_provider="Número inválido"
        )

        db.add(notif)
        db.commit()

        return

    try:

        response = client.messages.create(
            body=mensaje,
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=f"whatsapp:{numero}"
        )

        notif = Notificacion(
            usuario_id=usuario.id,
            canal="WHATSAPP",
            destinatario=numero,
            mensaje=mensaje,
            estado="ENVIADO",
            respuesta_provider=response.sid,
            enviado_at=datetime.utcnow()
        )

        db.add(notif)
        db.commit()

        registrar_log(
            db,
            usuario.id,
            "NOTIFICACIONES",
            "ENVIO WHATSAPP",
            f"WhatsApp enviado correctamente a {numero}"
        )

        print("✅ WhatsApp enviado")

    except Exception as e:

        notif = Notificacion(
            usuario_id=usuario.id,
            canal="WHATSAPP",
            destinatario=numero,
            mensaje=mensaje,
            estado="ERROR",
            respuesta_provider=str(e)
        )

        db.add(notif)
        db.commit()

        registrar_log(
            db,
            usuario.id,
            "NOTIFICACIONES",
            "ERROR WHATSAPP",
            str(e)
        )

        print("❌ Error WhatsApp:", e)


def agregar_notificacion_app(db, usuario_id, mensaje, canal="APP"):
    notif = Notificacion(
        usuario_id=usuario_id,
        canal=canal,
        mensaje=mensaje,
        estado="PENDIENTE",
        leido=False,
        created_at=datetime.utcnow()
    )
    db.add(notif)
    db.commit()
    return notif

def notificar_administradores(db, mensaje):
    from app.models.models import Usuario, Rol
    # Obtener IDs de roles admin y coordinador
    roles = db.query(Rol).filter(Rol.nombre.in_(["admin", "coordinator"])).all()
    roles_ids = [r.id for r in roles]
    
    # Obtener usuarios con esos roles
    admins = db.query(Usuario).filter(Usuario.rol_id.in_(roles_ids)).all()
    
    for admin in admins:
        agregar_notificacion_app(db, admin.id, mensaje)
