from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..db.dependencies import get_db
from ..core.deps import get_current_user, require_roles
from ..models.models import Modulo, Permiso, RolModuloPermiso, Rol
from pydantic import BaseModel

router = APIRouter(prefix="/permissions", tags=["Permisos"])

# Acciones disponibles en el sistema (equivalente a columnas en la imagen)
ACCIONES_SISTEMA = [
    "Agregar", "Modificar", "Grabar", "Consultar",
    "Eliminar", "Imprimir", "Confirmar", "Procesar",
    "Ejecutar", "Anular", "Exportar"
]

# Estructura jerárquica de módulos del sistema
MODULOS_SISTEMA = [
    {
        "codigo": "USU",
        "nombre": "Usuarios",
        "is_folder": True,
        "orden": 1,
        "children": [
            {"codigo": "USU1", "nombre": "Directorio de Usuarios", "orden": 1},
            {"codigo": "USU2", "nombre": "Solicitudes de Acceso", "orden": 2},
            {"codigo": "USU3", "nombre": "Acceso Denegado", "orden": 3},
        ]
    },
    {
        "codigo": "CAS",
        "nombre": "Casos",
        "is_folder": True,
        "orden": 2,
        "children": [
            {"codigo": "CAS1", "nombre": "Gestión de Casos", "orden": 1},
            {"codigo": "CAS2", "nombre": "Detalle de Caso", "orden": 2},
        ]
    },
    {
        "codigo": "REP",
        "nombre": "Reportes",
        "is_folder": True,
        "orden": 3,
        "children": [
            {"codigo": "REP1", "nombre": "Reportes de Casos", "orden": 1},
            {"codigo": "REP2", "nombre": "Reportes de Usuarios", "orden": 2},
            {"codigo": "REP3", "nombre": "Consultas SQL", "orden": 3},
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
            {"codigo": "CFG1", "nombre": "Gestión de Roles", "orden": 1},
            {"codigo": "CFG2", "nombre": "Gestión de Permisos", "orden": 2},
            {"codigo": "CFG3", "nombre": "Temas y Apariencia", "orden": 3},
        ]
    },
]

def seed_modulos_and_permisos(db: Session):
    """Inserta la estructura inicial de módulos y permisos si no existe."""
    # Seed permisos (acciones)
    if db.query(Permiso).count() == 0:
        for accion in ACCIONES_SISTEMA:
            db.add(Permiso(nombre=accion))
        db.commit()

    # Seed módulos jerárquicos
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
            db.flush()  # Para obtener el ID

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
    modulo_id: int
    permiso_id: int


@router.get("/seed")
def trigger_seed(db: Session = Depends(get_db), user=Depends(require_roles(1))):
    """Fuerza la re-creación del seed de módulos y permisos."""
    # Borrar todo y re-crear
    db.query(RolModuloPermiso).delete()
    db.query(Modulo).delete()
    db.query(Permiso).delete()
    db.commit()
    seed_modulos_and_permisos(db)
    return {"message": "Seed aplicado correctamente"}


@router.get("/modulos")
def get_modulos(db: Session = Depends(get_db)):
    seed_modulos_and_permisos(db)
    # Retorna todos los módulos en orden jerárquico
    modulos = db.query(Modulo).order_by(Modulo.orden).all()
    return [
        {
            "id": m.id,
            "codigo": m.codigo,
            "nombre": m.nombre,
            "is_folder": m.is_folder,
            "parent_id": m.parent_id,
            "orden": m.orden,
        }
        for m in modulos
    ]


@router.get("/tipos")
def get_tipos_permiso(db: Session = Depends(get_db)):
    seed_modulos_and_permisos(db)
    permisos = db.query(Permiso).all()
    return permisos


@router.get("/roles/{rol_id}")
def get_permisos_rol(rol_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
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
    permisos_in: List[PermisoAsignar],
    db: Session = Depends(get_db),
    user=Depends(require_roles(1))
):
    # Remove existing permissions for the role
    db.query(RolModuloPermiso).filter(RolModuloPermiso.rol_id == rol_id).delete()
    db.commit()

    # Helper to collect all ancestor module ids for a given set of module ids
    def get_ancestor_ids(module_ids: set[int]) -> set[int]:
        ancestors = set()
        for mid in module_ids:
            modulo = db.query(Modulo).filter(Modulo.id == mid).first()
            while modulo and modulo.parent_id:
                ancestors.add(modulo.parent_id)
                modulo = db.query(Modulo).filter(Modulo.id == modulo.parent_id).first()
        return ancestors

    assigned_module_ids = {p.modulo_id for p in permisos_in}
    # Include their ancestor (parent) modules
    all_module_ids = assigned_module_ids.union(get_ancestor_ids(assigned_module_ids))

    # Determine default permission (Consultar) or fallback to first
    default_perm = db.query(Permiso).filter(Permiso.nombre == "Consultar").first()
    if not default_perm:
        default_perm = db.query(Permiso).first()

    # Insert permissions for each module (including parents)
    for mod_id in all_module_ids:
        # Find specific permission for this module if provided
        specific = next((p for p in permisos_in if p.modulo_id == mod_id), None)
        permiso_id = specific.permiso_id if specific else default_perm.id
        # Avoid duplicate primary key errors
        existing = db.query(RolModuloPermiso).filter(
            RolModuloPermiso.rol_id == rol_id,
            RolModuloPermiso.modulo_id == mod_id,
            RolModuloPermiso.permiso_id == permiso_id
        ).first()
        if not existing:
            db.add(RolModuloPermiso(rol_id=rol_id, modulo_id=mod_id, permiso_id=permiso_id))
    db.commit()


@router.get("/mis-permisos")
def get_mis_permisos(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Devuelve los permisos del usuario actual organizados por módulo."""
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
