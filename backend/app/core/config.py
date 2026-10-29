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

    # --- Autenticación ---
    # Clave para firmar las sesiones. Genera una con:
    #   python -c "import secrets; print(secrets.token_urlsafe(48))"
    # Si está vacía se usa una temporal (las sesiones se pierden al reiniciar).
    secret_key: str = ""
    token_days: int = 7                    # duración de la sesión
    cookie_name: str = "mealtous_session"
    cookie_secure: bool = False            # True cuando se sirva por HTTPS propio
    allow_registration: bool = True        # False para cerrar el alta de usuarios


settings = Settings()
