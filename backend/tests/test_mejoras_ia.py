"""Compra en dos peticiones con dos proveedores y días de la semana en castellano."""
import json

from app.ai.agent import MealAgent
from app.schemas.menu import DayPlan, Dish, WeeklyPlan
from app.schemas.preferences import UserPreferences
from app.schemas.requests import PlanContext

LIST_JSON = json.dumps({"shopping_list": [
    {"name": "tomate", "quantity": 2, "unit": "kg", "category": "verduras"}]})


def recipes_json(ingredient="tomate"):
    return json.dumps({"recipes": [{"dish_name": "Ensalada", "servings": 2, "prep_minutes": 10,
                                    "ingredients": [{"name": ingredient, "quantity": 1, "unit": "kg"}],
                                    "steps": ["Lavar", "Cortar"]}]})


class Recorder:
    def __init__(self, replies):
        self.replies = list(replies)
        self.prompts = []

    def complete(self, system, messages, max_tokens=2000):
        self.prompts.append((messages[0]["content"], max_tokens))
        return self.replies.pop(0)


def make_plan(day_names):
    dish = lambda n: Dish(name=n, diet_type="healthy", kcal_per_serving=500, ingredients=[])
    days = [DayPlan(day=d, lunch=dish("Ensalada"), dinner=dish("Sopa")) for d in day_names]
    return WeeklyPlan(diet_type="healthy", target_kcal_per_day=2000, days=days)


ES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]


def test_list_goes_to_shopping_llm_and_recipes_to_main():
    main, shop = Recorder([recipes_json()]), Recorder([LIST_JSON])
    ctx = PlanContext(preferences=UserPreferences(people=2))
    result = MealAgent(main, shop).build_shopping_and_recipes(ctx, make_plan(ES))
    assert len(shop.prompts) == 1 and "lista de la compra" in shop.prompts[0][0]
    assert len(main.prompts) == 1 and "receta" in main.prompts[0][0].lower()
    assert shop.prompts[0][1] <= 2500 and main.prompts[0][1] <= 5000
    assert result.shopping_list[0].name == "tomate" and result.recipes[0].dish_name == "Ensalada"


def test_same_provider_used_when_no_second_one():
    llm = Recorder([LIST_JSON, recipes_json()])
    ctx = PlanContext(preferences=UserPreferences(people=1))
    result = MealAgent(llm).build_shopping_and_recipes(ctx, make_plan(ES))
    assert len(llm.prompts) == 2 and result.recipes


def test_recipes_are_checked_against_allergies():
    main, shop = Recorder([recipes_json("cacahuete"), recipes_json("arroz")]), Recorder([LIST_JSON])
    ctx = PlanContext(preferences=UserPreferences(people=1, allergies=["cacahuete"]))
    result = MealAgent(main, shop).build_shopping_and_recipes(ctx, make_plan(ES))
    assert len(main.prompts) == 2
    assert result.recipes[0].ingredients[0].name == "arroz"


def test_english_days_become_spanish():
    en = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    assert [d.day for d in make_plan(en).days] == ES
    assert [d.day for d in make_plan(["Mon", "TUE", "wed.", "Thu", "Fri", "Sat", "Sun"]).days] == ES
    assert [d.day for d in make_plan(ES).days] == ES
