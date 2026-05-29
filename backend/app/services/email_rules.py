import re

def es_posible_caso(correo: dict) -> bool:
    asunto = (correo.get("asunto") or "").lower().strip()
    cuerpo = (correo.get("cuerpo") or "").strip()

    # ❌ respuestas o forwards
    if asunto.startswith(("re:", "fw:", "fwd:")):
        return False

    # ❌ sin contenido útil
    if len(cuerpo) < 15:
        return False

    return True

def extraer_numero_caso(asunto: str):
    # Soporta CASO-2024-0001 y el anterior CASE-XXXX
    match = re.search(r"(CASO-\d{4}-\d{4}|CASE-[A-Z0-9]+)", asunto.upper())
    return match.group(0) if match else None



def es_caso_nuevo(correo: dict):
    asunto = correo.get("asunto") or ""
    numero = extraer_numero_caso(asunto)

    if numero:
        return False, numero  # existente

    return True, None  # nuevo

def es_destinatario_valido(destinatario: str):
    if not destinatario:
        return False

    return destinatario.lower().endswith("@icvc.co")