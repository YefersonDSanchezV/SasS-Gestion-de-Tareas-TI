import psycopg2
import os
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

def update_db():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ No se encontró DATABASE_URL")
        return

    try:
        # Extraer parámetros de la URL
        result = urlparse(db_url)
        username = result.username
        password = result.password
        database = result.path[1:]
        hostname = result.hostname
        port = result.port

        print(f"🔄 Conectando a la base de datos en {hostname}...")
        
        conn = psycopg2.connect(
            database=database,
            user=username,
            password=password,
            host=hostname,
            port=port
        )
        cur = conn.cursor()

        print("🛠️ Añadiendo columna 'enviado_por_correo' a la tabla 'observaciones'...")
        
        # SQL para añadir la columna si no existe
        sql = """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name='observaciones' AND column_name='enviado_por_correo'
            ) THEN
                ALTER TABLE observaciones ADD COLUMN enviado_por_correo BOOLEAN DEFAULT FALSE;
            END IF;

            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name='casos' AND column_name='updated_at'
            ) THEN
                ALTER TABLE casos ADD COLUMN updated_at TIMESTAMP;
            END IF;

            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name='usuarios' AND column_name='tipo_identificacion'
            ) THEN
                ALTER TABLE usuarios ADD COLUMN tipo_identificacion VARCHAR(10);
            END IF;

            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name='usuarios' AND column_name='numero_identificacion'
            ) THEN
                ALTER TABLE usuarios ADD COLUMN numero_identificacion VARCHAR(50);
            END IF;
        END $$;
        """


        
        cur.execute(sql)
        conn.commit()
        
        print("✅ Columna añadida exitosamente.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error al actualizar la base de datos: {e}")

if __name__ == "__main__":
    update_db()
