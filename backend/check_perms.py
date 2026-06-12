import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)

with engine.connect() as conn:
    res = conn.execute(text("""
    SELECT m.nombre 
    FROM rol_modulo_permiso rmp
    JOIN modulos m ON rmp.modulo_id = m.id
    WHERE rmp.rol_id = 3;
    """))
    print("Permissions for rol_id=3:")
    for row in res:
        print(row)
