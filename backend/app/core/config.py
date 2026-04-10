from pathlib import Path
from pydantic_settings import BaseSettings

# Resolve .env relative to this file's location so it works regardless of CWD
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    app_name: str = "ScamAware API"
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:5173"]

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    openai_api_key: str = ""

    class Config:
        env_file = str(_ENV_FILE)


settings = Settings()
