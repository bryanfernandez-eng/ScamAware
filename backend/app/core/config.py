from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ScamAware API"
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:5173"]

    virustotal_api_key: str = ""

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    class Config:
        env_file = ".env"


settings = Settings()
