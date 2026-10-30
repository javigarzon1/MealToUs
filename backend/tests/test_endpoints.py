"""Despensa y preferencias: requieren sesión y están aisladas por usuario."""
from fastapi.testclient import TestClient

from app.main import app


def test_requires_login(client):
    for path in ("/api/pantry", "/api/preferences"):
        assert client.get(path).status_code == 401


def test_pantry_add_list_delete(auth_client):
    r = auth_client.post("/api/pantry", json={"name": "6 huevos", "quantity": "500 g"})
    assert r.status_code == 201
    item_id = r.json()["id"]
    assert [i["name"] for i in auth_client.get("/api/pantry").json()] == ["6 huevos"]
    assert auth_client.delete(f"/api/pantry/{item_id}").status_code == 204
    assert auth_client.get("/api/pantry").json() == []


def test_pantry_delete_not_found(auth_client):
    assert auth_client.delete("/api/pantry/9999").status_code == 404


def test_pantry_is_per_user(auth_client):
    item_id = auth_client.post("/api/pantry", json={"name": "queso"}).json()["id"]
    other = TestClient(app)
    other.post("/api/auth/register", json={"email": "bea@example.com", "password": "otra-clave-123"})
    assert other.get("/api/pantry").json() == []
    assert other.delete(f"/api/pantry/{item_id}").status_code == 404
    assert len(auth_client.get("/api/pantry").json()) == 1


def test_preferences_default_and_upsert(auth_client):
    assert auth_client.get("/api/preferences").json()["people"] == 1
    body = {"people": 3, "allergies": ["nueces"], "intolerances": ["lactosa"], "dislikes": ["espinacas"]}
    assert auth_client.post("/api/preferences", json=body).json() == body
    body["people"] = 4
    auth_client.post("/api/preferences", json=body)
    assert auth_client.get("/api/preferences").json()["people"] == 4
