"""Tope de calorías, cena más ligera, día de inicio, contexto del chat y plantillas de compra."""
import json

import pytest
from pydantic import ValidationError

from app.ai.agent import MealAgent
from app.schemas.menu import DayPlan, Dish, WeeklyPlan
from app.schemas.preferences import UserPreferences
from app.schemas.requests import PlanContext, TodayMenu, WeeklyPlanRequest
from app.schemas.shopping import Recipe

ES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]


class Recorder:
    def __init__(self, replies=()):
        self.replies = list(replies)
        self.calls = 0
        self.systems = []

    def complete(self, system, messages, max_tokens=2000):
        self.calls += 1
        self.systems.append(system)
        return self.replies.pop(0)


def dish(name="Plato", kcal=500, diet="healthy"):
    return Dish(name=name, diet_type=diet, kcal_per_serving=kcal, ingredients=[])


def options_json(kcals):
    return json.dumps({"options": [
        dish(f"Plato {t}", k, t).model_dump(mode="json")
        for t, k in zip(("healthy", "normal", "sport"), kcals)]})


def plan_json(lunch_kcal, dinner_kcal, names=ES):
    days = [DayPlan(day=n, lunch=dish("Comida", lunch_kcal), dinner=dish("Cena", dinner_kcal))
            for n in names]
    plan = WeeklyPlan(diet_type="healthy", target_kcal_per_day=1800, days=days)
    return json.dumps(plan.model_dump(mode="json"))


def ctx(max_kcal=None):
    return PlanContext(preferences=UserPreferences(people=1, max_kcal_per_day=max_kcal))


# ---------- tope de calorías y cena ligera ----------
def test_lunch_options_respect_the_daily_cap():
    # Tope 1500 -> la comida admite hasta 900 kcal. La primera respuesta se pasa.
    llm = Recorder([options_json([500, 1000, 600]), options_json([500, 700, 800])])
    result = MealAgent(llm).propose_lunch_options(ctx(1500))
    assert llm.calls == 2
    assert all(d.kcal_per_serving <= 900 for d in result.options)


def test_no_cap_means_no_calorie_check():
    llm = Recorder([options_json([500, 1500, 2500])])
    MealAgent(llm).propose_lunch_options(ctx(None))
    assert llm.calls == 1


def test_dinner_options_must_be_lighter_than_lunch():
    llm = Recorder([options_json([500, 600, 700]), options_json([350, 400, 450])])
    result = MealAgent(llm).propose_dinner_options(ctx(), dish("Comida", 500))
    assert llm.calls == 2
    assert all(d.kcal_per_serving < 500 for d in result.options)


def test_dinner_options_also_fit_in_the_daily_cap():
    # Comida 800 con tope 1000 -> la cena debe quedar por debajo de 201 kcal
    llm = Recorder([options_json([300, 350, 400]), options_json([150, 180, 200])])
    result = MealAgent(llm).propose_dinner_options(ctx(1000), dish("Comida", 800))
    assert llm.calls == 2
    assert all(d.kcal_per_serving + 800 <= 1000 for d in result.options)


def test_weekly_plan_dinner_lighter_every_day():
    llm = Recorder([plan_json(500, 500), plan_json(500, 400)])
    result = MealAgent(llm).build_weekly_plan(ctx(), dish("Comida", 500), dish("Cena", 400))
    assert llm.calls == 2
    assert all(d.dinner.kcal_per_serving < d.lunch.kcal_per_serving for d in result.days)


def test_weekly_plan_respects_daily_cap():
    llm = Recorder([plan_json(600, 500), plan_json(500, 300)])
    result = MealAgent(llm).build_weekly_plan(ctx(900), dish("Comida", 500), dish("Cena", 300))
    assert llm.calls == 2
    assert all(d.lunch.kcal_per_serving + d.dinner.kcal_per_serving <= 900 for d in result.days)
    assert result.target_kcal_per_day <= 900


# ---------- día de inicio ----------
def test_weekly_plan_starts_on_chosen_day_even_if_model_ignores_it():
    llm = Recorder([plan_json(500, 400)])  # el modelo devuelve lunes..domingo
    result = MealAgent(llm).build_weekly_plan(
        ctx(), dish("Comida", 500), dish("Cena", 400), start_day="sábado")
    assert [d.day for d in result.days] == ["sábado", "domingo", "lunes", "martes",
                                            "miércoles", "jueves", "viernes"]


def test_start_day_defaults_to_monday():
    llm = Recorder([plan_json(500, 400)])
    result = MealAgent(llm).build_weekly_plan(ctx(), dish("Comida", 500), dish("Cena", 400))
    assert result.days[0].day == "lunes" and result.days[-1].day == "domingo"


@pytest.mark.parametrize("raw,expected", [("Sabado", "sábado"), ("wednesday", "miércoles"),
                                          (" Lunes ", "lunes"), (None, None), ("", None)])
def test_start_day_is_normalized(raw, expected):
    req = WeeklyPlanRequest(chosen_lunch=dish(), chosen_dinner=dish(), start_day=raw)
    assert req.start_day == expected


def test_invalid_start_day_is_rejected():
    with pytest.raises(ValidationError):
        WeeklyPlanRequest(chosen_lunch=dish(), chosen_dinner=dish(), start_day="festivo")


# ---------- asistente: la receta de hoy ----------
def test_chat_receives_todays_recipe():
    recipe = Recipe(dish_name="Lentejas", servings=1, prep_minutes=30,
                    ingredients=[], steps=["Hervir las lentejas"])
    today = TodayMenu(day="jueves", lunch=dish("Lentejas", 520), dinner=dish("Tortilla", 380),
                      recipes=[recipe])
    llm = Recorder(["ok"])
    assert MealAgent(llm).chat([{"role": "user", "content": "¿Qué me toca hoy?"}], None, today) == "ok"
    system = llm.systems[0]
    assert "jueves" in system and "Lentejas" in system and "Hervir las lentejas" in system


def test_chat_without_menu_has_no_today_section():
    llm = Recorder(["ok"])
    MealAgent(llm).chat([{"role": "user", "content": "hola"}], None, None)
    assert "Hoy es" not in llm.systems[0]


# ---------- plantillas de la compra ----------
ITEMS = [{"name": "leche", "quantity": 2, "unit": "l", "category": "lácteos"},
         {"name": "pan", "quantity": 1, "unit": "ud", "category": "despensa"}]


def test_templates_require_login(client):
    assert client.get("/api/templates").status_code == 401


def test_template_save_list_and_overwrite(auth_client):
    r = auth_client.post("/api/templates", json={"name": "Semanal", "items": ITEMS})
    assert r.status_code == 200 and r.json()["items"] == ITEMS
    # mismo nombre: sustituye, no duplica
    auth_client.post("/api/templates", json={"name": "Semanal", "items": ITEMS[:1]})
    lst = auth_client.get("/api/templates").json()
    assert len(lst) == 1 and lst[0]["items"] == ITEMS[:1]


def test_template_delete_and_isolation_between_users(auth_client):
    tid = auth_client.post("/api/templates", json={"name": "Mía", "items": ITEMS}).json()["id"]
    auth_client.post("/api/auth/logout")
    auth_client.post("/api/auth/register", json={"email": "luis@example.com",
                                                 "password": "otra-contraseña-9"})
    assert auth_client.get("/api/templates").json() == []
    assert auth_client.delete(f"/api/templates/{tid}").status_code == 404
    auth_client.post("/api/auth/logout")
    auth_client.post("/api/auth/login", json={"email": "ana@example.com",
                                              "password": "contraseña-segura-1"})
    assert auth_client.delete(f"/api/templates/{tid}").status_code == 204
    assert auth_client.get("/api/templates").json() == []


def test_template_needs_a_name_and_has_a_limit(auth_client):
    assert auth_client.post("/api/templates", json={"name": "  ", "items": ITEMS}).status_code == 422
    assert auth_client.post("/api/templates", json={"name": "x" * 81, "items": ITEMS}).status_code == 422
    for i in range(30):
        assert auth_client.post("/api/templates", json={"name": f"p{i}", "items": ITEMS}).status_code == 200
    assert auth_client.post("/api/templates", json={"name": "una más", "items": ITEMS}).status_code == 400
