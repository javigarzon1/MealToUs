from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "MealToUs"
    database_url: str = "sqlite:///./mealtous.db"
    cors_origins: list[str] = ["http://localhost:5173"]

    llm_provider: str = "anthropic"  # anthropic | openai
    llm_model: str = "claude-sonnet-5-5"
    anthropic_api_key: str = ""
    openai_api_key: str = ""

    # JWT Configuration
    secret_key: str = "your-secret-key-change-this-in-production"  # noqa: F811
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30


settings = Settings()
