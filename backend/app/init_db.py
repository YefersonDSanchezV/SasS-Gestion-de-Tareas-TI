from .db.database import engine, Base
from .models.models import *


print("Creando tablas...")
Base.metadata.create_all(bind=engine)
print("Tablas creadas exitosamente.")
