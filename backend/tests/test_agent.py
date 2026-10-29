"""Tests for MealAgent using FakeLLM (no API key needed)."""
import json

from fastapi.testclient import TestClient

from app.ai.agent import MealAgent, AgentError
from app.schemas.preferences import UserPreferences
from app.schemas.requests import PlanContext
from app.schemas.menu import Dish, DishOptions, WeeklyPlan, DayPlan


class FakeLLM:
    """LLM falso para probar sin API key ni coste."""

    def __init__(self, replies):
        self.replies = list(replies)
        self.calls = 0

    def complete(self, system, messages, max_tokens=2000):
        self.calls += 1
        return self.replies.pop(0)


def options(ingredient: str) -> str:
    dishes = [
        {
            "name": f"Plato {t}",
            "diet_type": t,
            "kcal_per_serving": 500,
            "ingredients": [{"name": ingredient, "quantity": 100, "unit": "g"}],
        }
        for t in ("healthy", "normal", "sport")
    ]
    return "```json\n" + json.dumps({"options": dishes}) + "\n```"


def test_retries_when_allergen_is_returned():
    """Test que el agente reintenta cuando el LLM devuelve un alérgeno."""
    llm = FakeLLM([options("cacahuete"), options("arroz")])
    ctx = PlanContext(preferences=UserPreferences(people=2, allergies=["cacahuete"]))
    result = MealAgent(llm).propose_lunch_options(ctx)
    assert llm.calls == 2, f"Expected 2 calls, got {llm.calls}"
    # El resultado final debería ser arroz, no cacahuete
    assert result.options[0].ingredients[0].name == "arroz"


def test_family_allergy_blocks_members():
    """Test que una alergia familiar bloquea miembros de la familia."""
    llm = FakeLLM([options("Queso fresco"), options("tofu")])
    ctx = PlanContext(preferences=UserPreferences(allergies=["lácteos"]))
    MealAgent(llm).propose_lunch_options(ctx)
    assert llm.calls == 2


def test_three_options_exactly():
    """Test que siempre se proponen exactamente 3 opciones."""
    llm = FakeLLM([options("pollo"), options("arroz"), options("carne")])
    ctx = PlanContext(preferences=UserPreferences(people=1))
    result = MealAgent(llm).propose_lunch_options(ctx)
    assert len(result.options) == 3
    # Verificar que tenemos los 3 tipos de dieta
    diet_types = [d.diet_type for d in result.options]
    assert "healthy" in diet_types
    assert "normal" in diet_types
    assert "sport" in diet_types


def test_weekly_plan_with_diet():
    """Test que el plan semanal respeta el tipo de dieta."""
    # The agent makes up to 3 calls (1 initial + 2 retries MAX_RETRIES=2)
    # Provide 3 replies, each with a full WeeklyPlan of 7 days
    days_list = [
        ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
    ] * 3  # 3 replies, each with 7 days
    
    weekly_replies = []
    for i in range(3):
        days = []
        for j, day_name in enumerate(days_list[0]):
            days.append(
                DayPlan(
                    day=day_name,
                    lunch=Dish(name="Ensalada", diet_type="healthy", kcal_per_serving=500, ingredients=[]),
                    dinner=Dish(name="Sopa", diet_type="healthy", kcal_per_serving=500, ingredients=[])
                )
            )
        weekly = WeeklyPlan(diet_type="healthy", target_kcal_per_day=2000, days=days)
        weekly_replies.append(json.dumps(weekly.model_dump()))
    
    llm = FakeLLM(weekly_replies)
    ctx = PlanContext(preferences=UserPreferences(people=1))
    plan_dish1 = Dish(name="Ensalada", diet_type="healthy", kcal_per_serving=500, ingredients=[])
    plan_dish2 = Dish(name="Sopa", diet_type="healthy", kcal_per_serving=500, ingredients=[])
    result = MealAgent(llm).build_weekly_plan(ctx, plan_dish1, plan_dish2)
    assert result.diet_type.value == "healthy"
    assert len(result.days) == 7


def test_shopping_result_structure():
    """Test que ShoppingResult tiene la estructura correcta."""
    shopping_json = (
        '{"shopping_list": [{"name": "tomate", "quantity": 2, "unit": "kg", "category": "frutas"}], '
        '"recipes": [{"dish_name": "Ensalada", "servings": 2, "prep_minutes": 15, '
        '"ingredients": [{"name": "tomate", "quantity": 1, "unit": "kg"}], "steps": ["Lavar", "Cortar", "Mezclar"]}]}'
    )
    # Provide 3 replies for the shopping test (agent may call multiple times)
    shopping_replies = [shopping_json] * 3
    llm = FakeLLM(shopping_replies)
    ctx = PlanContext(preferences=UserPreferences(people=2))
    # Create a weekly plan with exactly 7 days as required by the schema
    days = []
    for i in range(7):
        days.append(
            DayPlan(
                day=["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"][i],
                lunch=Dish(name="Ensalada", diet_type="healthy", kcal_per_serving=500, ingredients=[]),
                dinner=Dish(name="Sopa", diet_type="healthy", kcal_per_serving=500, ingredients=[])
            )
        )
    plan = WeeklyPlan(diet_type="healthy", target_kcal_per_day=2000, days=days)
    result = MealAgent(llm).build_shopping_and_recipes(ctx, plan)
    assert "shopping_list" in result.model_dump()
    assert "recipes" in result.model_dump()
    assert len(result.shopping_list) > 0


def test_agent_error_when_no_valid_response():
    """Test que lanza AgentError cuando el LLM falla tres veces."""
    llm = FakeLLM(["invalid reply 1", "invalid reply 2", "invalid reply 3"])
    ctx = PlanContext(preferences=UserPreferences(people=1))
    try:
        MealAgent(llm).propose_lunch_options(ctx)
        assert False, "Debe haber lanzado AgentError"
    except AgentError as e:
        assert "No se obtuvo una respuesta válida" in str(e)
        # El LLM debería haber sido llamado 3 veces (MAX_RETRIES + 1 = 3)
        assert llm.calls == 3