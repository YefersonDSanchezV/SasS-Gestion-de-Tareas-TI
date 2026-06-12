import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)

with engine.connect() as conn:
    res = conn.execute(text("SELECT id, username, rol_id FROM usuarios WHERE username LIKE '%yeferson%';"))
    for row in res:
        print(row)
