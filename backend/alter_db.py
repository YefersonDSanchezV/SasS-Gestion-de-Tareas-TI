import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE modulos ADD COLUMN IF NOT EXISTS codigo VARCHAR(20);"))
        conn.execute(text("ALTER TABLE modulos ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES modulos(id);"))
        conn.execute(text("ALTER TABLE modulos ADD COLUMN IF NOT EXISTS is_folder BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE modulos ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;"))
        conn.commit()
        print("Columns added successfully.")
    except Exception as e:
        print("Error:", e)
