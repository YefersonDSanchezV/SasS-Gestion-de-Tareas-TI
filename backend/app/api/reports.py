from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import io
import pandas as pd

from ..db.dependencies import get_db
from ..core.deps import get_current_user
from ..models.models import Usuario, Caso, Rol

# Tratar de importar reportlab para PDF. Si falla, el fallback es CSV.
try:
    from reportlab.lib.pagesizes import letter, landscape
    from reportlab.pdfgen import canvas
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False


router = APIRouter(prefix="/reports", tags=["Reportes"])

@router.get("/users/metrics")
def get_user_metrics(db: Session = Depends(get_db), user = Depends(get_current_user)):
    total_usuarios = db.query(Usuario).count()
    
    current_month = datetime.now().month
    current_year = datetime.now().year
    nuevos_mes = db.query(Usuario).filter(
        func.extract('month', Usuario.created_at) == current_month,
        func.extract('year', Usuario.created_at) == current_year
    ).count()
    
    roles_activos = db.query(Rol).filter(Rol.estado == "ACTIVO").count()
    
    # Usuarios por rol (para grafico)
    roles_dist = db.query(Rol.nombre, func.count(Usuario.id)).outerjoin(Usuario).group_by(Rol.nombre).all()
    distribucion = [{"rol": r[0], "cantidad": r[1]} for r in roles_dist]

    return {
        "total_usuarios": total_usuarios,
        "nuevos_mes": nuevos_mes,
        "roles_activos": roles_activos,
        "distribucion": distribucion
    }

@router.get("/users/export")
def export_users(format: str = "csv", db: Session = Depends(get_db), user = Depends(get_current_user)):
    usuarios = db.query(Usuario).all()
    
    data = []
    for u in usuarios:
        data.append({
            "Nombre Completo": f"{u.primer_nombre} {u.primer_apellido}",
            "Username": u.username,
            "Tipo ID": u.tipo_identificacion,
            "Numero ID": u.numero_identificacion,
            "Telefono": u.celular,
            "Correo Personal": u.correo_personal,
            "Correo Inst.": u.correo_institucional,
            "Rol": u.rol.nombre if u.rol else "Sin Rol",
            "Estado": u.estado,
            "Fecha Creacion": u.created_at.strftime("%Y-%m-%d") if u.created_at else ""
        })
        
    df = pd.DataFrame(data)
    
    if format == "csv":
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=usuarios.csv"
        return response
        
    elif format == "xlsx":
        stream = io.BytesIO()
        df.to_excel(stream, index=False, engine='openpyxl')
        stream.seek(0)
        response = StreamingResponse(stream, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response.headers["Content-Disposition"] = "attachment; filename=usuarios.xlsx"
        return response
        
    elif format == "pdf" and HAS_REPORTLAB:
        stream = io.BytesIO()
        doc = SimpleDocTemplate(stream, pagesize=landscape(letter))
        
        styles = getSampleStyleSheet()
        styleN = styles["BodyText"]
        styleN.wordWrap = 'CJK'
        styleN.fontSize = 7
        
        # Wrap the data in Paragraphs to avoid clipping
        table_data = []
        table_data.append(df.columns.tolist())
        for row in df.values.tolist():
            wrapped_row = [Paragraph(str(cell), styleN) for cell in row]
            table_data.append(wrapped_row)
        
        t = Table(table_data, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 8),
            ('BACKGROUND', (0,1), (-1,-1), colors.beige),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
        ]))
        
        doc.build([t])
        stream.seek(0)
        response = StreamingResponse(stream, media_type="application/pdf")
        response.headers["Content-Disposition"] = "attachment; filename=usuarios.pdf"
        return response
        
    raise HTTPException(status_code=400, detail="Formato no soportado o librería faltante")

@router.get("/cases/metrics")
def get_cases_metrics(db: Session = Depends(get_db), user = Depends(get_current_user)):
    total_casos = db.query(Caso).count()
    
    # Eficiencia operativa: casos finalizados / casos totales
    casos_finalizados = db.query(Caso).filter(Caso.estado_id == 3).count() # Asumiendo 3 es Finalizado/Cerrado
    eficiencia = (casos_finalizados / total_casos * 100) if total_casos > 0 else 0
    
    # Promedio tiempo respuesta (simplificado)
    # requeriria logica de fechas de atencion, aca daremos un valor mockeado u obtenido de sla
    promedio_respuesta = "2.5 hrs" 
    
    return {
        "total_casos": total_casos,
        "eficiencia_operativa": round(eficiencia, 2),
        "promedio_respuesta": promedio_respuesta
    }

@router.get("/cases/export")
def export_cases(format: str = "csv", columns: str = "Numero,Titulo,Estado", db: Session = Depends(get_db), user = Depends(get_current_user)):
    casos = db.query(Caso).all()
    selected_cols = columns.split(",")
    
    data = []
    for c in casos:
        row = {}
        if "Numero" in selected_cols: row["Numero"] = c.numero_caso
        if "Titulo" in selected_cols: row["Titulo"] = c.titulo
        if "Estado" in selected_cols: row["Estado"] = c.estado.nombre if c.estado else "N/A"
        if "Prioridad" in selected_cols: row["Prioridad"] = c.prioridad.nombre if c.prioridad else "N/A"
        if "Fecha de Creacion" in selected_cols: row["Fecha de Creacion"] = c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else "N/A"
        if "Ultima Actualizacion" in selected_cols: row["Ultima Actualizacion"] = c.updated_at.strftime("%Y-%m-%d %H:%M") if c.updated_at else (c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else "N/A")
        if "Descripcion" in selected_cols: row["Descripcion"] = c.descripcion or "N/A"
        if "Asignado A" in selected_cols: row["Asignado A"] = f"{c.usuario_asignado.primer_nombre} {c.usuario_asignado.primer_apellido}" if c.usuario_asignado else "N/A"
        if "Asignado Por" in selected_cols: row["Asignado Por"] = f"{c.usuario_asignador.primer_nombre} {c.usuario_asignador.primer_apellido}" if c.usuario_asignador else "N/A"
        data.append(row)
        
    df = pd.DataFrame(data)
    
    if format == "csv":
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=casos.csv"
        return response
        
    elif format == "xlsx":
        stream = io.BytesIO()
        df.to_excel(stream, index=False, engine='openpyxl')
        stream.seek(0)
        response = StreamingResponse(stream, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response.headers["Content-Disposition"] = "attachment; filename=casos.xlsx"
        return response
        
    elif format == "pdf" and HAS_REPORTLAB:
        stream = io.BytesIO()
        doc = SimpleDocTemplate(stream, pagesize=landscape(letter))
        
        styles = getSampleStyleSheet()
        styleN = styles["BodyText"]
        styleN.wordWrap = 'CJK'
        styleN.fontSize = 7
        
        table_data = []
        table_data.append(df.columns.tolist())
        for row in df.values.tolist():
            wrapped_row = [Paragraph(str(cell), styleN) for cell in row]
            table_data.append(wrapped_row)

        t = Table(table_data, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 8),
            ('BACKGROUND', (0,1), (-1,-1), colors.beige),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
        ]))
        doc.build([t])
        stream.seek(0)
        response = StreamingResponse(stream, media_type="application/pdf")
        response.headers["Content-Disposition"] = "attachment; filename=casos.pdf"
        return response

    raise HTTPException(status_code=400, detail="Formato no soportado o librería faltante")
