import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)

with engine.connect() as conn:
    try:
        # Check columns in modulos
        res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'modulos';"))
        for row in res:
            print(row)
    except Exception as e:
        print(e)
