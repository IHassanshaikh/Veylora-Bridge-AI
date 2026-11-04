import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Ensure .env and DB are always loaded from backend directory with absolute path
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
db_path = backend_dir / "trustbridge.db"
load_dotenv(env_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Veylora Bridge AI"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = f"sqlite:///{db_path.as_posix()}"
    
    # PayPal Sandbox Configuration
    PAYPAL_MODE: str = "sandbox"  # sandbox or live
    PAYPAL_CLIENT_ID: Optional[str] = os.getenv("PAYPAL_CLIENT_ID", "")
    PAYPAL_CLIENT_SECRET: Optional[str] = os.getenv("PAYPAL_CLIENT_SECRET", "")
    PAYPAL_WEBHOOK_ID: Optional[str] = os.getenv("PAYPAL_WEBHOOK_ID", "")
    
    # Gemini AI Configuration
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    
    # Storage
    EVIDENCE_DIR: str = "./evidence_vault"
    
    # Security / Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "0ef41621813d705ffb7edc218e8bd5722cd02b234549759fef2d8af78203e203bee5a76748f8c54fa3586b9d17b1dd7806487090176ee994ad0e02fbcd1d3565")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY", "0ef41621813d705ffb7edc218e8bd5722cd02b234549759fef2d8af78203e203bee5a76748f8c54fa3586b9d17b1dd7806487090176ee994ad0e02fbcd1d3565"))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    model_config = SettingsConfigDict(env_file=str(env_path), case_sensitive=True, extra="allow")

settings = Settings()
