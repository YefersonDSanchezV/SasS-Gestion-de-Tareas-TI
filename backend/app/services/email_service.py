from sqlalchemy.orm import Session
from app.models.models import Correo, Usuario, Caso
from app.services.email_rules import es_posible_caso, es_caso_nuevo

import imaplib
import email
from email.header import decode_header
import os
import re
from dotenv import load_dotenv

load_dotenv()


# =========================
# UTILIDADES
# =========================

def extraer_lista_emails(texto):
    if not texto:
        return []

    partes = texto.split(",")
    correos = []

    for p in partes:
        match = re.search(r"<(.+?)>", p)
        email = match.group(1) if match else p
        correos.append(email.strip().lower())

    return correos


def extraer_email(texto):
    if not texto:
        return None
    match = re.search(r"<(.+?)>", texto)
    return match.group(1).lower() if match else texto.lower().strip()


# =========================
# IMAP
# =========================

def conectar_imap():
    mail = imaplib.IMAP4_SSL(os.getenv("IMAP_SERVER"))
    mail.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
    return mail


def leer_correos():
    mail = conectar_imap()
    mail.select("inbox")

    status, messages = mail.search(None, "ALL")
    correos = []

    print("📥 Correos encontrados:", len(messages[0].split()))

    for num in messages[0].split():
        status, msg_data = mail.fetch(num, "(RFC822)")

        for response in msg_data:
            if isinstance(response, tuple):
                msg = email.message_from_bytes(response[1])

                message_id = msg.get("Message-ID")

                subject, encoding = decode_header(msg["Subject"])[0]
                if isinstance(subject, bytes):
                    subject = subject.decode(encoding or "utf-8", errors="ignore")

                from_ = extraer_email(msg.get("From"))

                # 🔥 IMPORTANTE: NO LIMPIES aquí
                to_raw = msg.get("To")

                body = ""

                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            body = part.get_payload(decode=True).decode(errors="ignore")
                else:
                    body = msg.get_payload(decode=True).decode(errors="ignore")

                correos.append({
                    "message_id": message_id,
                    "asunto": subject,
                    "remitente": from_,
                    "destinatario_raw": to_raw,
                    "cuerpo": body
                })

    mail.logout()
    return correos


# =========================
# PROCESAMIENTO
# =========================

async def procesar_correos(db: Session):
    from app.services.case_service import crear_caso, agregar_observacion

    correos = leer_correos()

    for c in correos:

        print("\n📩 Procesando:", c["asunto"])

        # 1. evitar duplicados
        existe = db.query(Correo).filter(
            Correo.message_id == c["message_id"]
        ).first()

        if existe:
            print("⚠️ Ya procesado")
            continue

        # 2. parsear destinatarios correctamente
        destinatarios = extraer_lista_emails(c["destinatario_raw"])

        print("📨 Destinatarios:", destinatarios)

        # 3. filtrar dominio válido
        destinatarios_icvc = [
            d for d in destinatarios if d.endswith("@icvc.co")
        ]

        if not destinatarios_icvc:
            print("⛔ No hay destinatarios válidos ICVC")
            continue

        # 4. validar si es caso real
        correo_normalizado = {
            "asunto": c["asunto"],
            "cuerpo": c["cuerpo"]
        }

        if not es_posible_caso(correo_normalizado):
            print("⛔ No cumple reglas de caso")
            continue

        # 5. guardar correo (ya validado)
        nuevo = Correo(
            message_id=c["message_id"],
            asunto=c["asunto"],
            remitente=c["remitente"],
            destinatario=",".join(destinatarios),
            cuerpo=c["cuerpo"]
        )

        db.add(nuevo)
        db.commit()

        # 6. buscar usuario destino
        usuario = db.query(Usuario).filter(
            Usuario.correo_institucional.in_(destinatarios_icvc)
        ).first()

        if not usuario:
            print("⛔ Usuario destino no existe")
            continue

        # 7. buscar asignador
        asignador = db.query(Usuario).filter(
            Usuario.correo_institucional == c["remitente"]
        ).first()

        if not asignador:
            print("⛔ Remitente no registrado")
            continue

        # 8. clasificar caso
        nuevo_caso, numero = es_caso_nuevo(c)

        # =====================
        # NUEVO CASO
        # =====================
        if nuevo_caso:

            print("🆕 Creando caso")

            class Data:
                titulo = c["asunto"]
                descripcion = c["cuerpo"]
                asignado_a = str(usuario.id)
                prioridad_id = 1
                cola_id = 1

            await crear_caso(db, Data, asignador)

        # =====================
        # CASO EXISTENTE
        # =====================
        else:

            print("🔁 Actualizando caso:", numero)

            caso = db.query(Caso).filter(
                Caso.numero_caso == numero
            ).first()

            if not caso:
                print("⛔ Caso no encontrado")
                continue

            class Obs:
                caso_id = str(caso.id)
                comentario = c["cuerpo"]
                enviar_correo = False

            await agregar_observacion(db, Obs, asignador)