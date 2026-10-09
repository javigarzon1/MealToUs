from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import menus, pantry, shopping
from app.core.config import settings
from app.db.session import Base, engine
from app.models import pantry as _pantry_model  # noqa: F401  (registra la tabla)

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins,
                   allow_methods=["*"], allow_headers=["*"])

for r in (pantry.router, menus.router, shopping.router):
    app.include_router(r, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
