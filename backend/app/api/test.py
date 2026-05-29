from fastapi import APIRouter, Depends
from app.core.deps import get_current_user

router = APIRouter(prefix="/test", tags=["Test"])

@router.get("/secure")
def secure_endpoint(user = Depends(get_current_user)):
    return {"message": "ok", "user": user.username}