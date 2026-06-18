import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)

with engine.connect() as conn:
    try:
        conn.execute(text("DELETE FROM rol_modulo_permiso;"))
        conn.execute(text("DELETE FROM modulos;"))
        conn.execute(text("DELETE FROM permisos;"))
        conn.commit()
        print("Tables cleared successfully.")
    except Exception as e:
        print("Error:", e)
