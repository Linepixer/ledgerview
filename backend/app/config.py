import os
from dotenv import load_dotenv

# Pull in environment variables from the root .env file
load_dotenv(dotenv_path="../.env")

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:password@localhost:5432/ledgerview" # Local dev fallback
    )
    
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 365 * 100  # Effectively an infinite session
    
    ENV: str = os.getenv("ENV", "development")
    
    @property
    def ADMIN_EMAILS(self) -> list[str]:
        emails = os.getenv("ADMIN_EMAILS", "")
        return [e.strip() for e in emails.split(",") if e.strip()]

settings = Settings()

if not settings.SECRET_KEY:
    raise ValueError("CRITICAL SECURITY ERROR: You MUST set a SECRET_KEY in the .env file!")
