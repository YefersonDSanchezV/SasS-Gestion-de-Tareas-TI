import asyncio
import time
from app.db.database import SessionLocal
from app.services.email_service import procesar_correos


async def run_worker():
    print("🚀 Worker de correos iniciado...")

    while True:
        db = SessionLocal()

        try:
            await procesar_correos(db)
            print("✅ Correos procesados")
        finally:
            db.close()

        except Exception as e:
            print("❌ Error worker:", e)

        await asyncio.sleep(30)


# 🔥 ESTO ES LO QUE TE FALTABA
if __name__ == "__main__":
    asyncio.run(run_worker())
