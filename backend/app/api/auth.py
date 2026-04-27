from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import user_service
from app.core import security

router = APIRouter(
    tags=["authentication"]
)

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # 1. Buscamos al usuario por su email
    user = user_service.get_user_by_email(db, email=form_data.username)
    
    # 2. Si no existe o la contraseña no coincide, devolvemos error genérico por seguridad
    if not user or not user_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Si todo está correcto, generamos el token JWT
    access_token = security.create_access_token(
        data={"sub": str(user.id)} # "sub" (subject) es el estándar JWT para el ID del usuario
    )
    
    # 4. Devolvemos el token en el formato que OAuth2 espera
    return {"access_token": access_token, "token_type": "bearer"}
