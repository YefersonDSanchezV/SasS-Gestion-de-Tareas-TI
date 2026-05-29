from fastapi import HTTPException
import uuid
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.services.notification_service import enviar_whatsapp, agregar_notificacion_app
from app.services.mail_sender import enviar_correo_seguimiento
from app.models.models import Caso, HistorialEstado, Observacion, Estado, Usuario, Prioridad

# La zona horaria se maneja a nivel de contenedor (TZ=America/Bogota) 
# y a nivel de sesión de base de datos.



def generar_numero_caso(db: Session):
    anio_actual = datetime.now().year
    prefix = f"CASO-{anio_actual}-"
    
    # Contar casos creados en el año actual para determinar el siguiente número
    count = db.query(Caso).filter(Caso.numero_caso.like(f"{prefix}%")).count()
    nuevo_numero = count + 1
    
    # Formatear con ceros a la izquierda (ej: 0001)
    return f"{prefix}{str(nuevo_numero).zfill(4)}"


def obtener_estado(db: Session, nombre: str):
    estado = db.query(Estado).filter(Estado.nombre == nombre).first()
    if not estado:
        raise HTTPException(status_code=404, detail=f"Estado {nombre} no encontrado")
    return estado


# =========================
# CREAR CASO
# =========================

async def crear_caso(db: Session, data, usuario_actual):

    estado_asignado = obtener_estado(db, "ASIGNADO")

    caso = Caso(
        id=uuid.uuid4(),
        numero_caso=generar_numero_caso(db),
        titulo=data.titulo,
        descripcion=data.descripcion,
        asignado_a=data.asignado_a,
        asignado_por=usuario_actual.id,
        estado_id=estado_asignado.id,
        prioridad_id=data.prioridad_id,
        cola_id=data.cola_id,
        fecha_inicio=datetime.now()
    )

    db.add(caso)

    historial = HistorialEstado(
        caso_id=caso.id,
        estado_id=estado_asignado.id,
        usuario_id=usuario_actual.id,
        fecha=datetime.now()
    )

    db.add(historial)

    db.commit()
    db.refresh(caso)

    # 📝 LOG
    from app.services.log_service import registrar_log
    registrar_log(db, usuario_actual.id, "CASOS", "Creación de Caso", f"Se creó el caso {caso.numero_caso}: {caso.titulo}")

    # 🔔 NOTIFICACIÓN
    usuario_asignado = db.query(Usuario).filter(Usuario.id == data.asignado_a).first()

    if usuario_asignado:
        mensaje = f"""
📌 Nuevo Caso Asignado
Caso: {caso.numero_caso}
Título: {caso.titulo}
Descripción: {caso.descripcion}
Asignado por: {usuario_actual.primer_nombre} {usuario_actual.primer_apellido}
"""
        enviar_whatsapp(db, usuario_asignado, mensaje)
        agregar_notificacion_app(db, usuario_asignado.id, mensaje)


    return caso


# =========================
# VER DETALLE (CAMBIO A EN OBSERVACION)
# =========================

async def ver_detalle_caso(db: Session, caso_id, usuario):
    caso = db.query(Caso).filter(Caso.id == caso_id).first()
    if not caso:
        return None
    
    estado_actual = caso.estado.nombre if caso.estado else ""
    
    if estado_actual == "ASIGNADO":
        estado_obs = obtener_estado(db, "EN OBSERVACION")
        caso.estado_id = estado_obs.id
        
        historial = HistorialEstado(
            caso_id=caso.id,
            estado_id=estado_obs.id,
            usuario_id=usuario.id,
            fecha=datetime.now()
        )
        db.add(historial)
        db.commit()

        # 📝 LOG - Cambio de estado al abrir
        from app.services.log_service import registrar_log
        registrar_log(db, usuario.id, "CASOS", "Cambio de Estado", f"El caso {caso.numero_caso} cambió a EN OBSERVACION al ser visualizado")
    
    return caso


# =========================
# AGREGAR OBSERVACIÓN
# =========================

async def agregar_observacion(db: Session, data, usuario):

    caso = db.query(Caso).filter(Caso.id == data.caso_id).first()

    if not caso:
        raise HTTPException(status_code=404, detail="Caso no encontrado")

    obs = Observacion(
        caso_id=caso.id,
        usuario_id=usuario.id,
        comentario=data.comentario,
        enviado_por_correo=data.enviar_correo,
        created_at=datetime.now()
    )

    db.add(obs)

    # 🔄 CAMBIO DE ESTADO A "EN EJECUCION"
    estado_ejec = obtener_estado(db, "EN EJECUCION")
    
    if caso.estado.nombre != "FINALIZADO":
        caso.estado_id = estado_ejec.id

    historial = HistorialEstado(
        caso_id=caso.id,
        estado_id=estado_ejec.id,
        usuario_id=usuario.id,
        fecha=datetime.now()
    )

    db.add(historial)

    db.commit()

    # 📝 LOGS
    from app.services.log_service import registrar_log
    registrar_log(db, usuario.id, "CASOS", "Nueva Observación", f"Se registró una observación en el caso {caso.numero_caso}")
    registrar_log(db, usuario.id, "CASOS", "Cambio de Estado", f"El caso {caso.numero_caso} cambió a EN EJECUCION")

    # 🔔 NOTIFICACIÓN (Notificar a la contraparte)
    destinatario_id = None
    
    # Si el que comenta es el técnico asignado, notificar al asignador
    if str(usuario.id) == str(caso.asignado_a):
        destinatario_id = caso.asignado_por
    # Si el que comenta es el asignador, notificar al técnico
    elif str(usuario.id) == str(caso.asignado_por):
        destinatario_id = caso.asignado_a
    # Si es un tercero (admin), notificar a ambos
    else:
        # Aquí podríamos notificar a ambos, pero por simplicidad notificamos al asignado
        destinatario_id = caso.asignado_a

    if destinatario_id:
        destinatario = db.query(Usuario).filter(Usuario.id == destinatario_id).first()
        if destinatario and destinatario.id != usuario.id:
            mensaje = f"👀 Actualización de Caso\nCaso: {caso.numero_caso}\nPor: {usuario.primer_nombre} {usuario.primer_apellido}\nComentario: {data.comentario[:100]}..."
            enviar_whatsapp(db, destinatario, mensaje)
            agregar_notificacion_app(db, destinatario.id, mensaje)


    
    # 📧 CORREO (al destinatario)
    if data.enviar_correo and destinatario:
        await enviar_correo_seguimiento(
            destinatario.correo_institucional, 
            caso.numero_caso, 
            data.comentario
        )

    return {"message": "Observación agregada correctamente"}


# =========================
# FINALIZAR CASO
# =========================

async def finalizar_caso(db: Session, caso_id, comentario, usuario, enviar_correo: bool = True):

    caso = db.query(Caso).filter(Caso.id == caso_id).first()

    if not caso:
        raise HTTPException(status_code=404, detail="Caso no existe")

    if not comentario:
        raise HTTPException(status_code=400, detail="Debe agregar observación final")

    obs = Observacion(
        caso_id=caso.id,
        usuario_id=usuario.id,
        comentario=comentario,
        enviado_por_correo=enviar_correo,
        created_at=datetime.now()
    )

    db.add(obs)

    estado_fin = obtener_estado(db, "FINALIZADO")

    caso.estado_id = estado_fin.id
    caso.fecha_finalizacion = datetime.now()

    historial = HistorialEstado(
        caso_id=caso.id,
        estado_id=estado_fin.id,
        usuario_id=usuario.id,
        fecha=datetime.now()
    )

    db.add(historial)

    db.commit()

    # 📝 LOGS
    from app.services.log_service import registrar_log
    registrar_log(db, usuario.id, "CASOS", "Caso Finalizado", f"Se finalizó el caso {caso.numero_caso}")
    registrar_log(db, usuario.id, "CASOS", "Cambio de Estado", f"El caso {caso.numero_caso} cambió a FINALIZADO")

    # 🔔 NOTIFICACIÓN (al que creó/asignó)
    asignador = db.query(Usuario).filter(Usuario.id == caso.asignado_por).first()

    if asignador:
        mensaje = f"""
✅ Caso Finalizado
Caso: {caso.numero_caso}
Detalle: {comentario}
"""
        enviar_whatsapp(db, asignador, mensaje)
        agregar_notificacion_app(db, asignador.id, mensaje)


        # 📧 CORREO (Obligatorio en finalizar, al asignador)
        await enviar_correo_seguimiento(
            asignador.correo_institucional, 
            caso.numero_caso, 
            f"CASO FINALIZADO. Observación final: {comentario}"
        )

    return {"message": "Caso finalizado"}


async def actualizar_prioridad_caso(db: Session, caso_id, prioridad_id, usuario):
    # Validar roles permitidos: 
    # Administrador, Coordinador de Sistemas, Ingeniero de Sistemas Profesional, Tecnico de Sistemas Profesional
    roles_permitidos = ["ADMINISTRADOR", "COORDINADOR DE SISTEMAS", "INGENIERO DE SISTEMAS PROFESIONAL", "TECNICO DE SISTEMAS PROFESIONAL"]
    
    rol_usuario = usuario.rol.nombre.upper()
    if rol_usuario not in roles_permitidos:
        raise HTTPException(status_code=403, detail="No tienes permisos para cambiar la prioridad de este caso")

    caso = db.query(Caso).filter(Caso.id == caso_id).first()
    if not caso:
        raise HTTPException(status_code=404, detail="Caso no encontrado")

    prioridad = db.query(Prioridad).filter(Prioridad.id == prioridad_id).first()
    if not prioridad:
        raise HTTPException(status_code=404, detail="Prioridad no encontrada")

    prioridad_anterior = caso.prioridad.nombre if caso.prioridad else "N/A"
    caso.prioridad_id = prioridad_id
    db.commit()

    # 📝 LOG
    from app.services.log_service import registrar_log
    registrar_log(db, usuario.id, "CASOS", "Cambio de Prioridad", f"La prioridad del caso {caso.numero_caso} cambió de {prioridad_anterior} a {prioridad.nombre}")

    # 🔔 NOTIFICACIÓN DE ACTUALIZACIÓN
    mensaje = f"⚠️ Cambio de Prioridad\nCaso: {caso.numero_caso}\nDe: {prioridad_anterior}\nA: {prioridad.nombre}\nPor: {usuario.primer_nombre} {usuario.primer_apellido}"
    
    # Notificar al que tiene asignado el caso
    if caso.asignado_a:
        agregar_notificacion_app(db, caso.asignado_a, mensaje)
    
    # Notificar al que creó el caso (si es diferente)
    if caso.asignado_por and caso.asignado_por != caso.asignado_a:
        agregar_notificacion_app(db, caso.asignado_por, mensaje)

    return {"message": "Prioridad actualizada correctamente", "nueva_prioridad": prioridad.nombre}


