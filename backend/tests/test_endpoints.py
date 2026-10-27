"""Tests for FastAPI endpoints using TestClient and SQLite in memory."""
import json
from fastapi.testclient import TestClient

from app.main import app, get_db
from app.db.session import Base, engine, get_db as _get_db
from app.models import pantry as _pantry_model  # noqa: F401 (registra la tabla)
from app.models import user_preferences as _upref_model  # noqa: F401 (registra la tabla)
from app.schemas.preferences import UserPreferences
from app.schemas.pantry import PantryItem


# Crear tablas en memoria para tests
TestingEngine = engine.connect()
TestingResult = engine.connect().execution_options(isolation_level=None)
Base.metadata.create_all(bind=TestingEngine)

client = TestClient(app)


def override_get_db():
    try:
        yield TestingEngine
    finally:
        pass


app.dependency_overrides[get_db] = override_get_db


def test_pantry_list_empty():
    """GET /api/pantry/ retorna lista vacía."""
    response = client.get("/api/pantry/")
    assert response.status_code == 200
    assert response.json() == []


def test_pantry_add_and_list():
    """POST /api/pantry/ y GET /api/pantry/."""
    item = {"name": "6 huevos", "quantity": "500 g"}
    response = client.post("/api/pantry/", json=item)
    assert response.status_code == 201
    assert response.json()["name"] == "6 huevos"

    response = client.get("/api/pantry/")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_pantry_delete_item():
    """DELETE /api/pantry/{item_id}."""
    # Primero añadimos un item
    client.post("/api/pantry/", json={"name": "500 g queso", "quantity": "500 g"})
    # Listamos para obtener el id
    items = client.get("/api/pantry/").json()
    item_id = items[0]["id"]
    # Eliminamos
    response = client.delete(f"/api/pantry/{item_id}")
    assert response.status_code == 204
    # Verificamos que se eliminó
    get_response = client.get("/api/pantry/")
    assert len(get_response.json()) == 0


def test_pantry_delete_not_found():
    """DELETE /api/pantry/{item_id} con id inexistente debe dar 404."""
    response = client.delete("/api/pantry/9999")
    assert response.status_code == 404


def test_user_preferences_schema():
    """Probar schema UserPreferences."""
    prefs = UserPreferences(people=2, allergies=["nuez"], intolerances=["lacteos"], dislikes=["espinacas"])
    assert prefs.people == 2
    assert "nuez" in prefs.allergies
    assert "lacteos" in prefs.intolerances
    assert "espinacas" in prefs.dislikes


def test_openapi_has_endpoints():
    """Verificar que la docs OpenAPI tenga los endpoints esperados."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    docs = response.json()
    paths = list(docs["paths"].keys())
    # Verificar que existen los endpoints clave
    assert "/api/pantry/" in str(paths)
    assert "/api/health" in str(paths)