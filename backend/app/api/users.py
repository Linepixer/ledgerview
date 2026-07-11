from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, ChangePasswordRequest
from app.services import user_service
from app.models.user import User
from app.api.dependencies import get_current_user
from app.core import security
from app.utils.email import send_verification_email

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
