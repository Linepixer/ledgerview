from sqlalchemy.orm import Session
import bcrypt
import uuid

from app.models.user import User
from app.schemas.user import UserCreate

def get_password_hash(password: str) -> str:
    # bcrypt requiere bytes, así que codificamos el string a utf-8
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)
    # Devolvemos un string para guardarlo en la base de datos
    return hashed_password.decode('utf-8')

def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    
    # Creamos el objeto User de SQLAlchemy
    db_user = User(
        id=uuid.uuid4(),
        email=user.email,
        hashed_password=hashed_password,
        is_active=True
    )
    
    # Lo agregamos a la sesión, lo guardamos y recargamos para obtener los datos generados por la DB
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user
