from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.dependencies import get_db
from app.api.auth import get_current_user
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/database", tags=["database"])

class QueryRequest(BaseModel):
    sql: str

@router.post("/query")
def execute_query(
    request: QueryRequest,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    # Solo administradores pueden ejecutar consultas SQL directas
    if current_user.rol_id != 1: # Asumiendo que 1 es Administrador
        raise HTTPException(status_code=403, detail="No tienes permisos para ejecutar consultas SQL")

    # Validaciones básicas de seguridad (muy limitadas, idealmente usaríamos un usuario de BD de solo lectura)
    # Por ahora permitiremos todo pero con precaución.
    
    try:
        result = db.execute(text(request.sql))
        
        # Si la consulta devuelve filas (como un SELECT)
        if result.returns_rows:
            columns = result.keys()
            rows = [dict(row._mapping) for row in result.all()]
            return {
                "type": "select",
                "columns": list(columns),
                "rows": rows,
                "row_count": len(rows)
            }
        else:
            # Para INSERT, UPDATE, DELETE
            db.commit()
            return {
                "type": "command",
                "row_count": result.rowcount,
                "message": f"Comando ejecutado con éxito. Filas afectadas: {result.rowcount}"
            }
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/dictionary")
def get_dictionary(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    # Solo administradores pueden ver el diccionario
    if current_user.rol_id != 1:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver el diccionario de datos")

    try:
        print("🔍 Consultando esquema de base de datos (multi-schema)...")
        # Consulta que busca en esquemas no-sistema
        query = text("""
            SELECT 
                c.table_schema,
                c.table_name, 
                c.column_name, 
                c.data_type, 
                c.is_nullable,
                c.column_default,
                col_description((quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass, c.ordinal_position) as column_comment
            FROM 
                information_schema.columns c
            WHERE 
                c.table_schema NOT IN ('information_schema', 'pg_catalog', 'auth', 'vault', 'realtime', 'extensions', 'storage')
            ORDER BY 
                c.table_schema, c.table_name, c.ordinal_position;
        """)
        
        result = db.execute(query)
        rows = [dict(row._mapping) for row in result.all()]
        print(f"📊 Se encontraron {len(rows)} columnas fuera de esquemas de sistema")
        
        # Agrupar por tabla (formato: esquema.tabla si no es public, o solo tabla)
        dictionary = {}
        for row in rows:
            schema = row["table_schema"]
            table_name = row["table_name"]
            
            # Si hay varios esquemas, usamos 'esquema.tabla' como llave
            # pero si el usuario solo usa uno, podemos simplificar
            full_table_name = table_name if schema == 'public' else f"{schema}.{table_name}"
            
            if full_table_name not in dictionary:
                dictionary[full_table_name] = []
            
            dictionary[full_table_name].append({
                "column": row["column_name"],
                "type": row["data_type"],
                "nullable": row["is_nullable"],
                "default": row["column_default"],
                "comment": row["column_comment"]
            })
            
        return dictionary
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
