import os

class Settings:
    PROJECT_NAME: str = "Work Continuity Cloud"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "continuity-cloud-super-secret-key-2026-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./work_continuity.db")
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "local")  # local or s3
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "work-continuity-checkpoints-prod")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    CORS_ORIGINS: list[str] = ["*"]

settings = Settings()
