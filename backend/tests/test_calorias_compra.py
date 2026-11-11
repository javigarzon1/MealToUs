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


def nutrition(kcal, **over):
    """Macros coherentes con las kcal: 25 % proteína, 45 % hidratos, 30 % grasa."""
    base = {"protein_g": kcal * 0.25 / 4, "carbs_g": kcal * 0.45 / 4, "fat_g": kcal * 0.30 / 9,
            "fiber_g": 5, "micros": ["Vitamina C 30 mg"]}
    return {**base, **over}


def dish(name="Plato", kcal=500, diet="healthy", with_nutrition=True):
    return Dish(name=name, diet_type=diet, kcal_per_serving=kcal, ingredients=[],
                nutrition=nutrition(kcal) if with_nutrition else None)


def options_json(kcals, with_nutrition=True, nutrition_override=None):
    out = []
    for t, k in zip(("healthy", "normal", "sport"), kcals):
        d = dish(f"Plato {t}", k, t, with_nutrition).model_dump(mode="json")
        if nutrition_override and t == "normal":
            d["nutrition"] = nutrition_override
        out.append(d)
    return json.dumps({"options": out})


def plan_json(lunch_kcal, dinner_kcal, diet="healthy", names=ES):
    days = [DayPlan(day=n, lunch=dish("Comida", lunch_kcal, diet), dinner=dish("Cena", dinner_kcal, diet))
            for n in names]
    plan = WeeklyPlan(diet_type=diet, target_kcal_per_day=1800, days=days)
    return json.dumps(plan.model_dump(mode="json"))


def ctx(max_kcal=None):
    return PlanContext(preferences=UserPreferences(people=1, max_kcal_per_day=max_kcal))


OK_LUNCH = [350, 650, 550]  # ligera <= 400, normal 600-700, deportista 500-600


# ---------- rangos por tipo de comida ----------
def test_valid_lunch_ranges_pass_first_time():
    llm = Recorder([options_json(OK_LUNCH)])
    result = MealAgent(llm).propose_lunch_options(ctx())
    assert llm.calls == 1
    assert [d.kcal_per_serving for d in result.options] == OK_LUNCH


@pytest.mark.parametrize("bad", [
    [450, 650, 550],   # ligera por encima de 400
    [350, 550, 550],   # normal por debajo de 600
    [350, 750, 550],   # normal por encima de 700
    [350, 650, 450],   # deportista por debajo de 500
    [350, 650, 650],   # deportista por encima de 600
])
def test_lunch_out_of_range_is_retried(bad):
    llm = Recorder([options_json(bad), options_json(OK_LUNCH)])
    result = MealAgent(llm).propose_lunch_options(ctx())
    assert llm.calls == 2
    assert [d.kcal_per_serving for d in result.options] == OK_LUNCH


def test_lunch_options_respect_the_daily_cap():
    # Tope 1000 -> la comida admite hasta 600 kcal: la normal de 650 se rechaza
    llm = Recorder([options_json([350, 650, 550]), options_json([350, 600, 550])])
    result = MealAgent(llm).propose_lunch_options(ctx(1000))
    assert llm.calls == 2
    assert all(d.kcal_per_serving <= 600 for d in result.options)


# ---------- la cena es más ligera ----------
def test_dinner_options_must_be_lighter_than_lunch():
    # Comida normal de 650: una cena normal de 650 no es más ligera y se rechaza
    llm = Recorder([options_json([350, 650, 550]), options_json([300, 600, 500])])
    result = MealAgent(llm).propose_dinner_options(ctx(), dish("Comida", 650, "normal"))
    assert llm.calls == 2
    assert all(d.kcal_per_serving < 650 for d in result.options)


def test_dinner_never_exceeds_its_own_diet_maximum():
    # Aunque la comida sea de 700, la cena ligera no puede pasar de 400
    llm = Recorder([options_json([450, 600, 500]), options_json([380, 600, 500])])
    result = MealAgent(llm).propose_dinner_options(ctx(), dish("Comida", 700, "normal"))
    assert llm.calls == 2
    assert result.options[0].kcal_per_serving <= 400


def test_dinner_options_also_fit_in_the_daily_cap():
    # Comida 600 con tope 1000 -> la cena debe quedar en 400 kcal o menos
    llm = Recorder([options_json([300, 500, 350]), options_json([300, 400, 350])])
    result = MealAgent(llm).propose_dinner_options(ctx(1000), dish("Comida", 600, "normal"))
    assert llm.calls == 2
    assert all(d.kcal_per_serving + 600 <= 1000 for d in result.options)


def test_weekly_plan_dinner_lighter_every_day():
    llm = Recorder([plan_json(380, 380), plan_json(380, 300)])
    result = MealAgent(llm).build_weekly_plan(ctx(), dish("Comida", 380), dish("Cena", 300))
    assert llm.calls == 2
    assert all(d.dinner.kcal_per_serving < d.lunch.kcal_per_serving for d in result.days)


def test_weekly_plan_lunch_must_match_its_diet_range():
    llm = Recorder([plan_json(450, 300), plan_json(380, 300)])  # ligera > 400
    MealAgent(llm).build_weekly_plan(ctx(), dish("Comida", 380), dish("Cena", 300))
    assert llm.calls == 2


def test_weekly_plan_respects_daily_cap():
    # Dieta normal con tope 1000: comida 600 + cena 550 = 1150 se rechaza; 600 + 400 = 1000 vale
    llm = Recorder([plan_json(600, 550, "normal"), plan_json(600, 400, "normal")])
    result = MealAgent(llm).build_weekly_plan(
        ctx(1000), dish("Comida", 600, "normal"), dish("Cena", 400, "normal"))
    assert llm.calls == 2
    assert all(d.lunch.kcal_per_serving + d.dinner.kcal_per_serving <= 1000 for d in result.days)
    assert result.target_kcal_per_day <= 1000


# ---------- información nutricional ----------
def test_dishes_without_nutrition_are_retried():
    llm = Recorder([options_json(OK_LUNCH, with_nutrition=False), options_json(OK_LUNCH)])
    result = MealAgent(llm).propose_lunch_options(ctx())
    assert llm.calls == 2
    assert all(d.nutrition is not None for d in result.options)


def test_macros_that_do_not_match_the_calories_are_retried():
    wrong = nutrition(650, protein_g=5, carbs_g=10, fat_g=2)  # ~78 kcal para un plato de 650
    llm = Recorder([options_json(OK_LUNCH, nutrition_override=wrong), options_json(OK_LUNCH)])
    MealAgent(llm).propose_lunch_options(ctx())
    assert llm.calls == 2


def test_nutrition_is_optional_in_the_schema_for_old_saved_menus():
    old = {"name": "Lentejas", "diet_type": "normal", "kcal_per_serving": 650, "ingredients": []}
    assert Dish.model_validate(old).nutrition is None


def test_nutrition_does_not_go_to_the_shopping_prompt():
    plan = WeeklyPlan(diet_type="healthy", target_kcal_per_day=700, days=[
        DayPlan(day=n, lunch=dish("Comida", 380), dinner=dish("Cena", 300)) for n in ES])
    shopping = json.dumps({"shopping_list": [{"name": "a", "quantity": 1, "unit": "ud", "category": "x"}],
                           "recipes": []})
    recipes = json.dumps({"recipes": [{"dish_name": "Comida", "servings": 1, "prep_minutes": 5,
                                       "ingredients": [], "steps": ["Cocinar"]}]})
    seen = []

    class Spy(Recorder):
        def complete(self, system, messages, max_tokens=2000):
            seen.append(messages[0]["content"])
            return super().complete(system, messages, max_tokens)

    MealAgent(Spy([shopping, recipes])).build_shopping_and_recipes(ctx(), plan)
    assert seen and all('"protein_g"' not in m for m in seen)


# ---------- día de inicio ----------
def test_weekly_plan_starts_on_chosen_day_even_if_model_ignores_it():
    llm = Recorder([plan_json(380, 300)])  # el modelo devuelve lunes..domingo
    result = MealAgent(llm).build_weekly_plan(
        ctx(), dish("Comida", 380), dish("Cena", 300), start_day="sábado")
    assert [d.day for d in result.days] == ["sábado", "domingo", "lunes", "martes",
                                            "miércoles", "jueves", "viernes"]


def test_start_day_defaults_to_monday():
    llm = Recorder([plan_json(380, 300)])
    result = MealAgent(llm).build_weekly_plan(ctx(), dish("Comida", 380), dish("Cena", 300))
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


# ---------- límite de tokens por petición (Groq: 8000 por minuto) ----------
from app.ai.budget import GROQ_BUDGET, estimate_tokens, fit_output, request_budget  # noqa: E402


def test_budget_is_automatic_only_for_groq():
    assert request_budget("https://api.groq.com/openai/v1") == GROQ_BUDGET
    assert request_budget("https://generativelanguage.googleapis.com/v1beta/openai/") == 0
    assert request_budget("") == 0
    assert request_budget("https://api.groq.com/openai/v1", override=6000) == 6000
    assert request_budget("https://otro.example", override=6000) == 6000


def test_output_is_reduced_so_input_plus_output_fit():
    text = "x" * 9000  # ~3050 tokens de entrada
    out = fit_output(5000, GROQ_BUDGET, text)
    assert out < 5000
    assert estimate_tokens(text) + out <= GROQ_BUDGET


def test_output_untouched_without_budget_or_with_room():
    assert fit_output(5000, 0, "x" * 90000) == 5000
    assert fit_output(1500, GROQ_BUDGET, "hola") == 1500


def test_output_never_below_the_floor():
    assert fit_output(5000, GROQ_BUDGET, "x" * 60000) == 1200


def test_retry_does_not_resend_the_failed_answer():
    big = options_json([450, 650, 550])  # ligera fuera de rango -> se rechaza
    seen = []

    class Spy(Recorder):
        def complete(self, system, messages, max_tokens=2000):
            seen.append(messages)
            return super().complete(system, messages, max_tokens)

    llm = Spy([big, options_json(OK_LUNCH)])
    MealAgent(llm).propose_lunch_options(ctx())
    assert len(seen) == 2
    assert len(seen[1]) == 1                                  # un solo mensaje, no se acumula
    assert "Plato healthy" not in seen[1][0]["content"].split("RECHAZADA")[0]  # sin la respuesta previa
    assert "RECHAZADA" in seen[1][0]["content"] and "400" in seen[1][0]["content"]


def test_compact_schema_is_smaller_and_still_describes_the_fields():
    from app.ai.agent import _compact_schema
    from app.schemas.menu import WeeklyPlan as W
    compact = _compact_schema(W)
    assert len(compact) < len(json.dumps(W.model_json_schema(), ensure_ascii=False))
    assert '"protein_g"' in compact and '"kcal_per_serving"' in compact and '"title"' not in compact


# ---------- respuestas cortadas (el modelo agota los tokens de salida) ----------
def test_truncated_answer_is_retried_with_brevity_hint():
    from app.ai.llm_client import ResponseTruncated

    seen = []

    class Cut(Recorder):
        def complete(self, system, messages, max_tokens=2000):
            seen.append(messages[0]["content"])
            if len(seen) == 1:
                raise ResponseTruncated("cortada")
            return super().complete(system, messages, max_tokens)

    llm = Cut([options_json(OK_LUNCH)])
    result = MealAgent(llm).propose_lunch_options(ctx())
    assert len(seen) == 2 and len(result.options) == 3
    assert "se cortó" in seen[1] and "RECHAZADA" in seen[1]


def test_persistent_truncation_ends_with_a_clear_error():
    from app.ai.agent import AgentError
    from app.ai.llm_client import ResponseTruncated

    class AlwaysCut(Recorder):
        def complete(self, system, messages, max_tokens=2000):
            raise ResponseTruncated("cortada")

    with pytest.raises(AgentError, match="se cortó"):
        MealAgent(AlwaysCut()).propose_lunch_options(ctx())


def test_prompt_asks_for_minified_json():
    llm = Recorder([options_json(OK_LUNCH)])
    seen = []
    orig = llm.complete
    llm.complete = lambda system, messages, max_tokens=2000: (seen.append(messages[0]["content"]),
                                                               orig(system, messages, max_tokens))[1]
    MealAgent(llm).propose_lunch_options(ctx())
    assert "MINIFICADO" in seen[0]


# ---------- extracción del JSON de la respuesta ----------
from app.ai.agent import extract_json  # noqa: E402


@pytest.mark.parametrize("raw", [
    '{"a": 1}',
    '```json\n{"a": 1}\n```',
    'Aquí tienes el menú: {"a": 1} ¡Que aproveche!',
    '{"a": 1}{"a": 1}',                      # objeto repetido
    '{"a": 1}\n\nNota: usa {sal} con moderación.',   # llaves en el texto de detrás
    '{"a": 1}\n```',
    '{"a": "con } llave y { dentro"}',
])
def test_extract_json_reads_the_first_complete_object(raw):
    assert "a" in extract_json(raw)


def test_extract_json_keeps_the_first_of_two_different_objects():
    assert extract_json('{"a": 1} {"a": 2}') == {"a": 1}


def test_extract_json_skips_leading_text_with_braces():
    assert extract_json('Ejemplo {no json} y ahora {"a": 1}') == {"a": 1}


@pytest.mark.parametrize("raw", ["sin json", '{"a": 1', ""])
def test_extract_json_fails_cleanly_when_there_is_no_valid_object(raw):
    with pytest.raises(ValueError):
        extract_json(raw)


def test_agent_accepts_an_answer_with_trailing_junk():
    llm = Recorder([options_json(OK_LUNCH) + "\n\nNota: platos de {tu despensa}."])
    result = MealAgent(llm).propose_lunch_options(ctx())
    assert llm.calls == 1 and len(result.options) == 3
