from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database (Supabase PostgreSQL or SQLite)
    DATABASE_URL: str = "sqlite+aiosqlite:///./kurippu.db"

    # Supabase direct API integration (optional)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "documents"

    # JWT
    JWT_SECRET: str = "kurippu-production-secure-jwt-secret-key-2026-turn-docs-into-actions"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days

    # AI
    AI_PROVIDER: str = "openai"  # openai | gemini | mock
    AI_API_KEY: str = ""
    AI_MODEL: str = "gpt-4o-mini"
    AI_BASE_URL: str = ""

    # Storage
    STORAGE_PROVIDER: str = "local"  # local | supabase | s3
    STORAGE_PATH: str = "./uploads"
    STORAGE_BUCKET: str = "documents"
    STORAGE_URL: str = ""
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"

    # App
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    MAX_UPLOAD_SIZE_MB: int = 50

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


settings = Settings()
