from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, ChangePasswordRequest
from app.services import user_service
from app.models.user import User
from app.models.transaction import Transaction
from app.api.dependencies import get_current_user
from app.core import security
from app.utils.email import send_verification_email, send_account_deletion_email
import jwt

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Verificamos si el email ya existe para evitar errores en la DB
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400, 
            detail="Email already registered"
        )
    
    # Llamamos al servicio para que lo encripte y lo guarde
    new_user = user_service.create_user(db=db, user=user)
    
    # Generar token y enviar email
    token = security.create_access_token(data={"sub": str(new_user.id), "type": "email_verification"})
    send_verification_email(new_user.email, token)
    
    return new_user

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = user_service.change_user_password(db, current_user, request.current_password, request.new_password)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La contraseña actual es incorrecta")
    
    return {"message": "Contraseña actualizada correctamente"}

@router.post("/me/request-delete")
def request_delete_account(current_user: User = Depends(get_current_user)):
    if current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Las cuentas de superusuario no pueden eliminarse"
        )
    token = security.create_access_token(data={"sub": str(current_user.id), "type": "account_deletion"})
    send_account_deletion_email(current_user.email, token)
    return {"message": "Email de confirmación enviado"}

@router.delete("/me")
def delete_account(
    token: str,
    db: Session = Depends(get_db)
):
    try:
        payload = security.decode_access_token(token)
        if payload.get("type") != "account_deletion":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo de token inválido")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token no contiene identificador")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="El enlace ha expirado. Por favor solicita uno nuevo.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")
        
    user = db.query(User).filter(User.id == user_id_str).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado o ya eliminado")
        
    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Las cuentas de superusuario no pueden eliminarse"
        )
        
    # Delete related transactions first to prevent FK constraint issues
    db.query(Transaction).filter(Transaction.user_id == user.id).delete()
    db.delete(user)
    db.commit()
    return {"message": "Cuenta eliminada permanentemente"}
