from sqlalchemy import text
from app.db.database import engine

def locate_table():
    with engine.connect() as conn:
        query = text("SELECT table_schema FROM information_schema.tables WHERE table_name = 'archivos';")
        result = conn.execute(query)
        rows = result.all()
        for row in rows:
            print(f"Table 'archivos' found in schema: {row[0]}")

if __name__ == "__main__":
    locate_table()
