import os
from dotenv import load_dotenv

# Carga las variables desde el archivo .env en la raíz del proyecto
load_dotenv(dotenv_path="../.env")

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:password@localhost:5432/ledgerview" # Fallback por si acaso
    )

settings = Settings()
