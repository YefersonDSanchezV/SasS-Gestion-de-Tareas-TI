from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from .api import auth, test, cases, users, dashboard, notifications, logs, roles, database, reports, permissions


from .db.database import engine, Base
from .models import models




# Crear tablas si no existen
try:
    Base.metadata.create_all(bind=engine)
    print("Tablas verificadas/creadas correctamente")
except Exception as e:
    print(f"Error al crear tablas: {e}")


app = FastAPI(

    title="Gestion de Tareas TI ICVC",
    description="Gestion de Tareas TI ICVC",
    version="1.0.0"
)

import os

# Configuración de CORS para permitir la conexión desde el frontend de forma segura
origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
origins = [origin.strip() for origin in origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Mensage": "Bienvenido al API de Gestion de Tareas por asignacion de correo institucional de ICVC. v1.0.0 --> " + datetime.now().isoformat()}

app.include_router(auth.router)

app.include_router(test.router)
app.include_router(cases.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(logs.router)
app.include_router(roles.router)
app.include_router(database.router)
app.include_router(reports.router)
app.include_router(permissions.router)