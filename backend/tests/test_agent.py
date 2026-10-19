import json

from app.ai.agent import MealAgent
from app.schemas.preferences import UserPreferences
from app.schemas.requests import PlanContext


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
    llm = FakeLLM([options("cacahuete"), options("arroz")])
    ctx = PlanContext(preferences=UserPreferences(people=2, allergies=["cacahuete"]))
    result = MealAgent(llm).propose_lunch_options(ctx)
    assert llm.calls == 2
    assert result.options[0].ingredients[0].name == "arroz"


def test_family_allergy_blocks_members():
    llm = FakeLLM([options("Queso fresco"), options("tofu")])
    ctx = PlanContext(preferences=UserPreferences(allergies=["lácteos"]))
    MealAgent(llm).propose_lunch_options(ctx)
    assert llm.calls == 2
