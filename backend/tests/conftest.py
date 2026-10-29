"""Fixtures: BD SQLite en memoria aislada por test y clientes con/sin sesión."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.rate_limit import login_limiter
from app.db.session import Base, get_db
from app.main import app
from app.models import pantry, user, user_preferences  # noqa: F401

settings.secret_key = settings.secret_key or "clave-solo-para-tests"

CREDS = {"email": "ana@example.com", "password": "contraseña-segura-1", "full_name": "Ana"}


@pytest.fixture
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False},
                           poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine, autoflush=False)

    def _get_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _get_db
    login_limiter.reset()
    settings.allow_registration = True
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(client):
    assert client.post("/api/auth/register", json=CREDS).status_code == 201
    return client
