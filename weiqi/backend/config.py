import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "围棋定式训练后端 API"
    VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite+aiosqlite:///./weiqi.db"

    KATAGO_PATH: Optional[str] = os.environ.get("KATAGO_PATH")
    KATAGO_CONFIG: Optional[str] = os.environ.get("KATAGO_CONFIG")
    KATAGO_MODEL: Optional[str] = os.environ.get("KATAGO_MODEL")

    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
