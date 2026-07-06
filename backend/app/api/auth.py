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
    # 1. Find user by email
    user = user_service.get_user_by_email(db, email=form_data.username)
    
    # 2. If not found or password mismatch, return generic error for security
    if not user or not user_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. If correct, generate JWT token
    access_token = security.create_access_token(
        data={"sub": str(user.id)} # "sub" (subject) is the JWT standard for user ID
    )
    
    # 4. Return the token in the format OAuth2 expects
    return {"access_token": access_token, "token_type": "bearer"}
