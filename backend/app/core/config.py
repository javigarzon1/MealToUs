from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "MealToUs"
    database_url: str = "sqlite:///./mealtous.db"
    # Carpeta con la web ya compilada (index.html). Si existe, el backend la sirve él mismo.
    static_dir: str = ""
    cors_origins: list[str] = ["http://localhost:5173"]

    llm_provider: str = "anthropic"  # anthropic | openai
    llm_model: str = "claude-sonnet-5-5"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    # Para proveedores compatibles con la API de OpenAI (Gemini, Groq...). Vacío = OpenAI.
    llm_base_url: str = ""
    # Tope de tokens de respuesta por petición (0 = sin tope). Útil en planes gratuitos con límite
    # de tokens por minuto: Groq cuenta lo que PIDES, no solo lo que se genera.
    llm_max_tokens: int = 0

    # Segundo proveedor opcional SOLO para la lista de la compra (p. ej. Gemini). Si
    # SHOPPING_LLM_PROVIDER está vacío, la lista se genera con el proveedor principal.
    shopping_llm_provider: str = ""      # anthropic | openai
    shopping_llm_model: str = ""
    shopping_llm_api_key: str = ""
    shopping_llm_base_url: str = ""
    shopping_llm_max_tokens: int = 0

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, v: str) -> str:
        """Neon, Supabase o Render dan `postgres://...`; SQLAlchemy necesita indicar el driver."""
        for prefix in ("postgres://", "postgresql://"):
            if v.startswith(prefix):
                return "postgresql+psycopg://" + v[len(prefix):]
        return v

    # --- Autenticación ---
    # Clave para firmar las sesiones. Genera una con:
    #   python -c "import secrets; print(secrets.token_urlsafe(48))"
    # Si está vacía se usa una temporal (las sesiones se pierden al reiniciar).
    secret_key: str = ""
    token_days: int = 7                    # duración de la sesión
    cookie_name: str = "mealtous_session"
    cookie_secure: bool = False            # True cuando se sirva por HTTPS propio
    allow_registration: bool = True        # False para cerrar el alta de usuarios

    # --- Recuperación de contraseña ---
    app_base_url: str = "http://localhost:5173"   # URL pública de la web (para el enlace del correo)
    reset_token_minutes: int = 30
    smtp_host: str = ""        # vacío = el correo se escribe en el log del servidor
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_starttls: bool = True


settings = Settings()
