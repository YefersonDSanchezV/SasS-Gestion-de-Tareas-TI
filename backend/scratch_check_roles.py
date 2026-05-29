from app.db.database import SessionLocal
from app.models.models import Rol

db = SessionLocal()
try:
    roles = db.query(Rol).all()
    for rol in roles:
        print(f"ID: {rol.id}, Nombre: {rol.nombre}")
finally:
    db.close()
