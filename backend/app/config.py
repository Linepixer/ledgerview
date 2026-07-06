import os
from dotenv import load_dotenv

# Load variables from .env file in project root
load_dotenv(dotenv_path="../.env")

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:password@localhost:5432/ledgerview" # Fallback just in case
    )
    
    # JWT Token
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7") # Safe default for dev
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 365 * 100  # 100 years (infinite session)

settings = Settings()
