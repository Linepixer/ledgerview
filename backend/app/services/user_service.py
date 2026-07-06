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

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_byte_enc = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_byte_enc)

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    
    # Creamos el objeto User de SQLAlchemy
    db_user = User(
        id=uuid.uuid4(),
        email=user.email,
        name=user.name,
        birth_date=user.birth_date,
        country=user.country,
        hashed_password=hashed_password,
        is_active=True
    )
    
    # Lo agregamos a la sesión, lo guardamos y recargamos para obtener los datos generados por la DB
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

def change_user_password(db: Session, user: User, current_password: str, new_password: str) -> bool:
    if not verify_password(current_password, user.hashed_password):
        return False
    
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return True
