from sqlalchemy import text
from app.db.database import engine

def check_schema():
    with engine.connect() as conn:
        # Check all schemas
        query = text("SELECT DISTINCT table_schema FROM information_schema.columns;")
        result = conn.execute(query)
        schemas = [row[0] for row in result.all()]
        print(f"Schemas found: {schemas}")
        
        # Check tables in public
        query = text("SELECT DISTINCT table_name FROM information_schema.columns WHERE table_schema = 'public';")
        result = conn.execute(query)
        tables = [row[0] for row in result.all()]
        print(f"Tables in public: {tables}")

if __name__ == "__main__":
    check_schema()
