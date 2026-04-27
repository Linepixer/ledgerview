import os
from dotenv import load_dotenv

# Carga las variables desde el archivo .env en la raíz del proyecto
load_dotenv(dotenv_path="../.env")

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:password@localhost:5432/ledgerview" # Fallback por si acaso
    )
    
    # Configuración JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7") # Valor por defecto seguro para dev
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

settings = Settings()
