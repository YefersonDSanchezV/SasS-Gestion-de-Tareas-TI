from sqlalchemy import Column, String, Integer, Text, ForeignKey, TIMESTAMP, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID             
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base
import uuid

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    primer_nombre = Column(String(100), nullable=False)
    segundo_nombre = Column(String(100))
    primer_apellido = Column(String(100), nullable=False)
    segundo_apellido = Column(String(100))
    
    tipo_identificacion = Column(String(10))
    numero_identificacion = Column(String(50))

    celular = Column(String(20))

    correo_personal = Column(String(150))
    correo_institucional = Column(String(150), nullable=False)

    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)

    rol_id = Column(Integer, ForeignKey("roles.id"))

    estado = Column(String(20), default="ACTIVO")

    created_at = Column(DateTime(timezone=True), server_default=func.now())


    rol = relationship("Rol")

class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text)
    estado = Column(String(20), default="ACTIVO")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Estado(Base):
    __tablename__ = "estados"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(50), unique=True, nullable=False)
    orden = Column(Integer)

class Prioridad(Base):
    __tablename__ = "prioridades"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(50), nullable=False)

class Cola(Base):
    __tablename__ = "colas"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)

class Caso(Base):
    __tablename__ = "casos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    numero_caso = Column(String(50), unique=True, nullable=False)
    titulo = Column(String(255), nullable=False)
    descripcion = Column(Text)

    asignado_a = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))
    asignado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))

    estado_id = Column(Integer, ForeignKey("estados.id"))
    prioridad_id = Column(Integer, ForeignKey("prioridades.id"))
    cola_id = Column(Integer, ForeignKey("colas.id"))

    fecha_inicio = Column(DateTime(timezone=True))
    fecha_finalizacion = Column(DateTime(timezone=True))


    sla_respuesta = Column(Integer)
    sla_resolucion = Column(Integer)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


    # Relaciones

    usuario_asignado = relationship("Usuario", foreign_keys=[asignado_a])
    usuario_asignador = relationship("Usuario", foreign_keys=[asignado_por])

    estado = relationship("Estado")
    prioridad = relationship("Prioridad")
    cola = relationship("Cola")

    observaciones = relationship("Observacion", back_populates="caso")

class Observacion(Base):
    __tablename__ = "observaciones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    caso_id = Column(UUID(as_uuid=True), ForeignKey("casos.id", ondelete="CASCADE"))
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))

    comentario = Column(Text, nullable=False)
    enviado_por_correo = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())



    caso = relationship("Caso", back_populates="observaciones")
    usuario = relationship("Usuario")

class HistorialEstado(Base):
    __tablename__ = "historial_estados"

    id = Column(Integer, primary_key=True)

    caso_id = Column(UUID(as_uuid=True), ForeignKey("casos.id", ondelete="CASCADE"))
    estado_id = Column(Integer, ForeignKey("estados.id"))
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))

    fecha = Column(DateTime(timezone=True), server_default=func.now())


    caso = relationship("Caso")
    estado = relationship("Estado")
    usuario = relationship("Usuario")

class Correo(Base):
    __tablename__ = "correos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    message_id = Column(Text, unique=True)
    asunto = Column(String(255))
    remitente = Column(String(150))
    destinatario = Column(String(150))
    cuerpo = Column(Text)

    fecha = Column(TIMESTAMP)
    procesado = Column(Boolean, default=False)

class Notificacion(Base):
    __tablename__ = "notificaciones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))

    canal = Column(String(50))  # WHATSAPP
    destinatario = Column(String(50))

    mensaje = Column(Text)

    estado = Column(String(50), default="PENDIENTE")
    respuesta_provider = Column(Text)

    enviado_at = Column(TIMESTAMP)
    leido = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


    usuario = relationship("Usuario")

class Archivo(Base):
    __tablename__ = "archivos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    caso_id = Column(UUID(as_uuid=True), ForeignKey("casos.id", ondelete="CASCADE"))

    nombre = Column(String(255))
    ruta = Column(Text)
    tipo = Column(String(100))
    tamaño = Column(Integer)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    caso = relationship("Caso")

class Log(Base):
    __tablename__ = "logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))
    modulo = Column(String(100))
    accion = Column(String(100))
    descripcion = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("Usuario")


class SolicitudAcceso(Base):
    __tablename__ = "solicitudes_acceso"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    primer_nombre = Column(String(50), nullable=False)
    segundo_nombre = Column(String(50))
    primer_apellido = Column(String(50), nullable=False)
    segundo_apellido = Column(String(50))
    tipo_identificacion = Column(String(20), nullable=False)
    numero_identificacion = Column(String(20), nullable=False, unique=True)
    correo_personal = Column(String(100), nullable=False)
    correo_institucional = Column(String(100), nullable=False)
    celular = Column(String(20), nullable=False)
    cargo_solicitado = Column(String(100))
    
    estado = Column(String(20), default="PENDIENTE") # PENDIENTE, APROBADA, RECHAZADA
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UsuarioBloqueado(Base):
    __tablename__ = "usuarios_bloqueados"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    primer_nombre = Column(String(50), nullable=False)
    segundo_nombre = Column(String(50))
    primer_apellido = Column(String(50), nullable=False)
    segundo_apellido = Column(String(50))
    tipo_identificacion = Column(String(20), nullable=False)
    numero_identificacion = Column(String(20), nullable=False, unique=True)
    correo_personal = Column(String(100), nullable=False)
    correo_institucional = Column(String(100), nullable=False)
    celular = Column(String(20), nullable=False)
    cargo = Column(String(100))
    
    fecha_bloqueo = Column(DateTime(timezone=True), server_default=func.now())
    motivo = Column(Text)

class Modulo(Base):
    __tablename__ = "modulos"

    id = Column(Integer, primary_key=True)
    codigo = Column(String(20), nullable=True)           # e.g. "USU", "CAS"
    nombre = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text)
    parent_id = Column(Integer, ForeignKey("modulos.id"), nullable=True)
    is_folder = Column(Boolean, default=False)           # True = carpeta, False = módulo hoja
    orden = Column(Integer, default=0)

    parent = relationship("Modulo", remote_side="Modulo.id", backref="children")

class Permiso(Base):
    __tablename__ = "permisos"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text)

class RolModuloPermiso(Base):
    __tablename__ = "rol_modulo_permiso"

    id = Column(Integer, primary_key=True)
    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"))
    modulo_id = Column(Integer, ForeignKey("modulos.id", ondelete="CASCADE"))
    permiso_id = Column(Integer, ForeignKey("permisos.id", ondelete="CASCADE"))

    rol = relationship("Rol")
    modulo = relationship("Modulo")
    permiso = relationship("Permiso")
