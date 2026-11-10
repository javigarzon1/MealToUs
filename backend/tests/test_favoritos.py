"""Menús favoritos: guardar, listar, sustituir por nombre, borrar y aislamiento entre usuarios."""
from tests.test_calorias_compra import ES, dish
from app.schemas.menu import DayPlan, WeeklyPlan


def plan(name="Comida"):
    days = [DayPlan(day=d, lunch=dish(name, 500), dinner=dish("Cena", 400)) for d in ES]
    return WeeklyPlan(diet_type="healthy", target_kcal_per_day=900, days=days).model_dump(mode="json")


def test_favorites_require_login(client):
    assert client.get("/api/favorites").status_code == 401


def test_save_list_and_overwrite(auth_client):
    r = auth_client.post("/api/favorites", json={"name": "Ligero", "plan": plan()})
    assert r.status_code == 200 and r.json()["plan"]["days"][0]["lunch"]["name"] == "Comida"
    auth_client.post("/api/favorites", json={"name": "Ligero", "plan": plan("Lentejas")})
    lst = auth_client.get("/api/favorites").json()
    assert len(lst) == 1 and lst[0]["plan"]["days"][0]["lunch"]["name"] == "Lentejas"


def test_invalid_plan_is_rejected(auth_client):
    bad = plan()
    bad["days"] = bad["days"][:3]  # un menú tiene que tener 7 días
    assert auth_client.post("/api/favorites", json={"name": "Roto", "plan": bad}).status_code == 422


def test_delete_and_isolation(auth_client):
    fid = auth_client.post("/api/favorites", json={"name": "Mío", "plan": plan()}).json()["id"]
    auth_client.post("/api/auth/logout")
    auth_client.post("/api/auth/register", json={"email": "luis@example.com",
                                                 "password": "otra-contraseña-9"})
    assert auth_client.get("/api/favorites").json() == []
    assert auth_client.delete(f"/api/favorites/{fid}").status_code == 404
    auth_client.post("/api/auth/logout")
    auth_client.post("/api/auth/login", json={"email": "ana@example.com",
                                              "password": "contraseña-segura-1"})
    assert auth_client.delete(f"/api/favorites/{fid}").status_code == 204
    assert auth_client.get("/api/favorites").json() == []


def test_name_required_and_limit(auth_client):
    assert auth_client.post("/api/favorites", json={"name": "  ", "plan": plan()}).status_code == 422
    for i in range(20):
        assert auth_client.post("/api/favorites", json={"name": f"m{i}", "plan": plan()}).status_code == 200
    assert auth_client.post("/api/favorites", json={"name": "otro", "plan": plan()}).status_code == 400
