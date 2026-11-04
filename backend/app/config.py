from functools import lru_cache

from pydantic_settings import BaseSettings

INSECURE_DEFAULT_SECRET = "dev-only-secret-change-me"


class Settings(BaseSettings):
    secret_key: str = INSECURE_DEFAULT_SECRET
    database_url: str = "sqlite:///./studypal.db"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.secret_key == INSECURE_DEFAULT_SECRET:
        import warnings

        warnings.warn(
            "SECRET_KEY 使用默认开发值，生产环境必须在 .env 中注入强随机密钥"
        )
    return settings
