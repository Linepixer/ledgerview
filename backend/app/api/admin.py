from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
import jwt

from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.user import UserResponse
from app.api.dependencies import get_current_superadmin
from app.core import security
from app.config import settings
from app.utils.email import send_admin_account_deletion_email
from pydantic import BaseModel

router = APIRouter(
    prefix="/admin",
    tags=["admin"]
)

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin)
):
    users = db.query(User).all()
    return users

@router.post("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta")
        
    user.is_active = not user.is_active
    db.commit()
    
    return {"message": f"Usuario {'activado' if user.is_active else 'desactivado'} con éxito", "is_active": user.is_active}

@router.post("/users/{user_id}/request-deletion")
def request_user_deletion(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta desde aquí")

    # Generate token valid for 10 minutes
    token = security.create_access_token(
        data={
            "sub": str(current_admin.id),
            "type": "admin_account_deletion",
            "target_user_id": str(user.id),
            "target_user_email": user.email
        },
        expires_delta=timedelta(minutes=10)
    )
    
    send_admin_account_deletion_email(current_admin.email, token, user.email)
    
    return {"message": "Correo de confirmación enviado"}

class ConfirmDeletionRequest(BaseModel):
    token: str
    confirmation_email: str

@router.post("/users/confirm-deletion")
def confirm_user_deletion(
    request: ConfirmDeletionRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin)
):
    try:
        payload = jwt.decode(request.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        admin_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        target_user_id: str = payload.get("target_user_id")
        target_user_email: str = payload.get("target_user_email")
        
        if admin_id is None or token_type != "admin_account_deletion":
            raise HTTPException(status_code=400, detail="Token inválido")
            
        if str(current_admin.id) != admin_id:
            raise HTTPException(status_code=403, detail="Este token pertenece a otro administrador")
            
        if request.confirmation_email.strip().lower() != target_user_email.strip().lower():
            raise HTTPException(status_code=400, detail="El email escrito no coincide con la cuenta a eliminar")
            
        user = db.query(User).filter(User.id == target_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="El usuario a eliminar ya no existe")
            
        # Delete related transactions first to prevent foreign key errors
        db.query(Transaction).filter(Transaction.user_id == user.id).delete()
        
        # Finally delete the user
        db.delete(user)
        db.commit()
        
        return {"message": "Cuenta y datos eliminados correctamente"}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="El enlace ha expirado")
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Token inválido")
