import logging
import secrets

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, menus, pantry, preferences, shopping
from app.api.deps import get_current_user
from app.core.config import settings
from app.db.migrate import ensure_columns
from app.db.session import Base, engine
from app.models import pantry as _pantry_model  # noqa: F401  (registra la tabla)
from app.models import user_preferences as _user_prefs_model  # noqa: F401  (registra la tabla)
from app.models import user as _user_model  # noqa: F401  (registra la tabla)

logger = logging.getLogger("uvicorn.error")

if not settings.secret_key:
    # Clave temporal: funciona, pero las sesiones caducan al reiniciar el servidor.
    settings.secret_key = secrets.token_urlsafe(48)
    logger.warning("SECRET_KEY no definida: usando una clave temporal. "
                   "Defínela en backend/.env para conservar las sesiones.")

Base.metadata.create_all(bind=engine)
ensure_columns(engine)

app = FastAPI(title=settings.app_name)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

# Login/registro públicos; todo lo demás exige sesión.
app.include_router(auth.router, prefix="/api")
for r in (pantry.router, preferences.router, menus.router, shopping.router):
    app.include_router(r, prefix="/api", dependencies=[Depends(get_current_user)])


@app.get("/health")
def health():
    return {"status": "ok"}
