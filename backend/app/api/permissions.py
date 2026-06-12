from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..db.dependencies import get_db
from ..core.deps import get_current_user, require_roles
from ..models.models import Modulo, Permiso, RolModuloPermiso, Rol
from pydantic import BaseModel

router = APIRouter(prefix="/permissions", tags=["Permisos"])

# El único permiso relevante es "Acceder" — controla si un rol puede ingresar al módulo
ACCIONES_SISTEMA = ["Acceder"]

# Estructura jerárquica que refleja EXACTAMENTE el menú lateral del sistema
MODULOS_SISTEMA = [
    {
        "codigo": "CAS",
        "nombre": "Gestión de Casos",
        "is_folder": False,
        "orden": 1,
        "children": []
    },
    {
        "codigo": "USU",
        "nombre": "Usuarios",
        "is_folder": True,
        "orden": 2,
        "children": [
            {"codigo": "USU1", "nombre": "Directorio de Usuarios", "orden": 1},
            {"codigo": "USU2", "nombre": "Solicitudes de Acceso",  "orden": 2},
            {"codigo": "USU3", "nombre": "Acceso Denegado",        "orden": 3},
        ]
    },
    {
        "codigo": "REP",
        "nombre": "Reportes",
        "is_folder": True,
        "orden": 3,
        "children": [
            {"codigo": "REP1", "nombre": "Reportes de Casos",    "orden": 1},
            {"codigo": "REP2", "nombre": "Reportes de Usuarios", "orden": 2},
            {"codigo": "REP3", "nombre": "Consultas SQL",        "orden": 3},
        ]
    },
    {
        "codigo": "LOG",
        "nombre": "Logs del Sistema",
        "is_folder": False,
        "orden": 4,
        "children": []
    },
    {
        "codigo": "CFG",
        "nombre": "Configuraciones",
        "is_folder": True,
        "orden": 5,
        "children": [
            {"codigo": "CFG1", "nombre": "Gestión de Roles",    "orden": 1},
            {"codigo": "CFG2", "nombre": "Gestión de Permisos", "orden": 2},
            {"codigo": "CFG3", "nombre": "Temas y Apariencia",  "orden": 3},
        ]
    },
]


def seed_modulos_and_permisos(db: Session):
    """Inserta la estructura inicial de módulos y permisos si no existe."""
    if db.query(Permiso).count() == 0:
        for accion in ACCIONES_SISTEMA:
            db.add(Permiso(nombre=accion))
        db.commit()

    if db.query(Modulo).count() == 0:
        for mod_data in MODULOS_SISTEMA:
            carpeta = Modulo(
                codigo=mod_data["codigo"],
                nombre=mod_data["nombre"],
                is_folder=mod_data["is_folder"],
                orden=mod_data["orden"],
                parent_id=None
            )
            db.add(carpeta)
            db.flush()

            for child_data in mod_data.get("children", []):
                hijo = Modulo(
                    codigo=child_data["codigo"],
                    nombre=child_data["nombre"],
                    is_folder=False,
                    orden=child_data["orden"],
                    parent_id=carpeta.id
                )
                db.add(hijo)
        db.commit()


class PermisoAsignar(BaseModel):
    """
    El frontend envía solo los módulos marcados (carpeta o hijo individual).
    El backend se encarga de expandir la carpeta a sus hijos automáticamente.
    """
    modulo_id: int


@router.get("/seed")
def trigger_seed(db: Session = Depends(get_db), user=Depends(require_roles(1))):
    """Fuerza la re-creación del seed de módulos y permisos."""
    db.query(RolModuloPermiso).delete()
    db.query(Modulo).delete()
    db.query(Permiso).delete()
    db.commit()
    seed_modulos_and_permisos(db)
    return {"message": "Seed aplicado correctamente"}


@router.get("/modulos")
def get_modulos(db: Session = Depends(get_db)):
    """Devuelve todos los módulos ordenados para construir la matriz."""
    seed_modulos_and_permisos(db)
    # Primero los padres (parent_id=None), luego los hijos, cada grupo por orden
    padres = db.query(Modulo).filter(Modulo.parent_id == None).order_by(Modulo.orden).all()
    result = []
    for padre in padres:
        result.append({
            "id": padre.id,
            "codigo": padre.codigo,
            "nombre": padre.nombre,
            "is_folder": padre.is_folder,
            "parent_id": padre.parent_id,
            "orden": padre.orden,
        })
        hijos = db.query(Modulo).filter(Modulo.parent_id == padre.id).order_by(Modulo.orden).all()
        for hijo in hijos:
            result.append({
                "id": hijo.id,
                "codigo": hijo.codigo,
                "nombre": hijo.nombre,
                "is_folder": hijo.is_folder,
                "parent_id": hijo.parent_id,
                "orden": hijo.orden,
            })
    return result


@router.get("/tipos")
def get_tipos_permiso(db: Session = Depends(get_db)):
    seed_modulos_and_permisos(db)
    permisos = db.query(Permiso).all()
    return permisos


@router.get("/roles/{rol_id}")
def get_permisos_rol(rol_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """
    Devuelve los IDs de módulos a los que el rol tiene acceso.
    """
    seed_modulos_and_permisos(db)
    permisos = db.query(RolModuloPermiso).filter(RolModuloPermiso.rol_id == rol_id).all()
    return [
        {
            "modulo_id": p.modulo_id,
            "permiso_id": p.permiso_id,
            "modulo_nombre": p.modulo.nombre if p.modulo else None,
            "permiso_nombre": p.permiso.nombre if p.permiso else None,
        }
        for p in permisos
    ]


@router.post("/roles/{rol_id}")
def update_permisos_rol(
    rol_id: int,
    modulos_in: List[PermisoAsignar],
    db: Session = Depends(get_db),
    user=Depends(require_roles(1))
):
    """
    Guarda los permisos de acceso de un rol.

    Reglas de cascada:
      - Carpeta marcada  → acceso a la CARPETA + TODOS sus hijos.
      - Hijo marcado     → acceso solo a ese HIJO + la CARPETA padre (para navegación).
    """
    # Limpiar permisos existentes del rol
    db.query(RolModuloPermiso).filter(RolModuloPermiso.rol_id == rol_id).delete()
    db.commit()

    # Obtener el permiso "Acceder"
    perm_acceder = db.query(Permiso).filter(Permiso.nombre == "Acceder").first()
    if not perm_acceder:
        raise HTTPException(
            status_code=500,
            detail="Permiso 'Acceder' no encontrado. Ejecute /permissions/seed"
        )

    modulos_a_guardar: set = set()

    for item in modulos_in:
        modulo = db.query(Modulo).filter(Modulo.id == item.modulo_id).first()
        if not modulo:
            continue

        if modulo.is_folder:
            # Carpeta seleccionada: acceso a la carpeta + todos sus submódulos
            modulos_a_guardar.add(modulo.id)
            hijos = db.query(Modulo).filter(Modulo.parent_id == modulo.id).all()
            for hijo in hijos:
                modulos_a_guardar.add(hijo.id)
        else:
            # Submódulo seleccionado: acceso al hijo + carpeta padre para navegación
            modulos_a_guardar.add(modulo.id)
            if modulo.parent_id:
                modulos_a_guardar.add(modulo.parent_id)

    # Insertar registros de acceso únicos
    for mod_id in modulos_a_guardar:
        existe = db.query(RolModuloPermiso).filter(
            RolModuloPermiso.rol_id == rol_id,
            RolModuloPermiso.modulo_id == mod_id,
            RolModuloPermiso.permiso_id == perm_acceder.id
        ).first()
        if not existe:
            db.add(RolModuloPermiso(
                rol_id=rol_id,
                modulo_id=mod_id,
                permiso_id=perm_acceder.id
            ))
    db.commit()

    return {"message": f"Permisos guardados. Total módulos con acceso: {len(modulos_a_guardar)}"}


@router.get("/mis-permisos")
def get_mis_permisos(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Devuelve los módulos accesibles del usuario actual."""
    if not user.rol_id:
        return {}

    permisos = db.query(RolModuloPermiso).filter(
        RolModuloPermiso.rol_id == user.rol_id
    ).all()

    resultado: Dict[str, list] = {}
    for p in permisos:
        if p.modulo and p.permiso:
            nombre_modulo = p.modulo.nombre
            if nombre_modulo not in resultado:
                resultado[nombre_modulo] = []
            resultado[nombre_modulo].append(p.permiso.nombre)

    return resultado
