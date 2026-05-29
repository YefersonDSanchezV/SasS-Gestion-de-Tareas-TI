from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from app.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def enviar_correo_seguimiento(email: EmailStr, caso_numero: str, comentario: str):
    
    if not settings.MAIL_SERVER or not settings.MAIL_USERNAME:
        print("⚠️ Configuración de correo incompleta. No se enviará email.")
        return False

    html = f"""
    <html>
        <body style="font-family: sans-serif; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #3b82f6;">Actualización de Caso: {caso_numero}</h2>
                <p>Se ha registrado una nueva observación en tu caso:</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><i>"{comentario}"</i></p>
                </div>
                <p>Puedes consultar el detalle en el portal de gestión.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999;">ICVC - Sistema de Gestión de Tareas TI</p>
            </div>
        </body>
    </html>
    """

    message = MessageSchema(
        subject=f"Actualización de Caso {caso_numero}",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"📧 Correo enviado a {email}")
        return True
    except Exception as e:
        print(f"❌ Error enviando correo: {e}")
        return False
