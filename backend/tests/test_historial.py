"""Historial: cada menú generado se anota solo, con un máximo de 10 por usuario."""
from app.api.deps import get_agent
from app.main import app
from app.schemas.menu import DayPlan, WeeklyPlan
from tests.test_calorias_compra import ES, dish

REQ = {
    "pantry": [], "preferences": {"people": 1, "allergies": [], "intolerances": [], "dislikes": []},
    "chosen_lunch": dish("Comida", 500).model_dump(mode="json"),
    "chosen_dinner": dish("Cena", 400).model_dump(mode="json"),
}


class _Agent:
    def __init__(self):
        self.n = 0

    def build_weekly_plan(self, ctx, lunch, dinner, start_day=None):
        self.n += 1
        days = [DayPlan(day=d, lunch=dish(f"Comida {self.n}", 500), dinner=dish("Cena", 400)) for d in ES]
        return WeeklyPlan(diet_type="healthy", target_kcal_per_day=900, days=days)


def generate(client, n=1):
    agent = _Agent()
    app.dependency_overrides[get_agent] = lambda: agent
    try:
        for _ in range(n):
            assert client.post("/api/menus/weekly-plan", json=REQ).status_code == 200
    finally:
        app.dependency_overrides.pop(get_agent, None)


def test_history_requires_login(client):
    assert client.get("/api/history").status_code == 401


def test_generated_menus_are_recorded_newest_first(auth_client):
    generate(auth_client, 3)
    rows = auth_client.get("/api/history").json()
    assert [r["plan"]["days"][0]["lunch"]["name"] for r in rows] == ["Comida 3", "Comida 2", "Comida 1"]
    assert rows[0]["created_at"]


def test_history_keeps_only_the_last_ten(auth_client):
    generate(auth_client, 13)
    rows = auth_client.get("/api/history").json()
    assert len(rows) == 10
    assert rows[0]["plan"]["days"][0]["lunch"]["name"] == "Comida 13"
    assert rows[-1]["plan"]["days"][0]["lunch"]["name"] == "Comida 4"


def test_failed_generation_is_not_recorded(auth_client):
    class Broken:
        def build_weekly_plan(self, *a, **k):
            raise RuntimeError("sin cuota")

    app.dependency_overrides[get_agent] = lambda: Broken()
    try:
        assert auth_client.post("/api/menus/weekly-plan", json=REQ).status_code == 502
    finally:
        app.dependency_overrides.pop(get_agent, None)
    assert auth_client.get("/api/history").json() == []


def test_delete_and_isolation(auth_client):
    generate(auth_client, 1)
    hid = auth_client.get("/api/history").json()[0]["id"]
    auth_client.post("/api/auth/logout")
    auth_client.post("/api/auth/register", json={"email": "luis@example.com",
                                                 "password": "otra-contraseña-9"})
    assert auth_client.get("/api/history").json() == []
    assert auth_client.delete(f"/api/history/{hid}").status_code == 404
    auth_client.post("/api/auth/logout")
    auth_client.post("/api/auth/login", json={"email": "ana@example.com",
                                              "password": "contraseña-segura-1"})
    assert auth_client.delete(f"/api/history/{hid}").status_code == 204
    assert auth_client.get("/api/history").json() == []
