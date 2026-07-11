from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import user_service
from app.core import security
from app.config import settings
from app.utils.email import send_verification_email
from app.models.user import User
import jwt

router = APIRouter(
    tags=["authentication"]
)

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # 1. Find user by email
    user = user_service.get_user_by_email(db, email=form_data.username)
    
    # 2. If not found or password mismatch, return generic error for security
    if not user or not user_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 3. Soft Block for unverified users
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="not_verified"
        )
    
    # 3. If correct, generate JWT token
    access_token = security.create_access_token(
        data={"sub": str(user.id)} # "sub" (subject) is the JWT standard for user ID
    )
    
    # 4. Return the token in the format OAuth2 expects
    return {"access_token": access_token, "token_type": "bearer"}

from pydantic import BaseModel
class ResendVerificationRequest(BaseModel):
    email: str

@router.post("/resend-verification")
def resend_verification(request: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = user_service.get_user_by_email(db, email=request.email)
    if not user:
        # Don't reveal if user exists or not for security
        return {"message": "Si la cuenta existe, se ha enviado un correo."}
        
    if user.is_verified:
        return {"message": "Esta cuenta ya está verificada."}
        
    token = security.create_access_token(data={"sub": str(user.id), "type": "email_verification"})
    send_verification_email(user.email, token)
    return {"message": "Correo enviado con éxito."}

@router.post("/verify")
def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "email_verification":
            raise HTTPException(status_code=400, detail="Token inválido")
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
        if user.is_verified:
            return {"message": "Cuenta ya verificada", "access_token": security.create_access_token(data={"sub": str(user.id)}), "token_type": "bearer"}
            
        user.is_verified = True
        db.commit()
        
        # Log in the user immediately after verification
        access_token = security.create_access_token(data={"sub": str(user.id)})
        return {"message": "Cuenta verificada con éxito", "access_token": access_token, "token_type": "bearer"}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="El link ha expirado")
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Token inválido")
