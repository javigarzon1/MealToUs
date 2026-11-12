"""Plan B: si el proveedor principal falla, el segundo responde."""
import json

from app.ai.agent import MealAgent
from app.schemas.preferences import UserPreferences
from app.schemas.requests import PlanContext
from app.schemas.menu import DishOptions


class Boom:
    def __init__(self):
        self.calls = 0

    def complete(self, system, messages, max_tokens=2000):
        self.calls += 1
        raise RuntimeError("429 límite de tokens")


class Fake:
    def __init__(self, replies):
        self.replies = list(replies)
        self.calls = 0

    def complete(self, system, messages, max_tokens=2000):
        self.calls += 1
        return self.replies.pop(0)


DISH = {"name": "Plato", "diet_type": "healthy", "kcal_per_serving": 350,
        "ingredients": [{"name": "arroz", "quantity": 100, "unit": "g"}]}
OPTIONS = json.dumps({"options": [DISH, {**DISH, "diet_type": "normal", "kcal_per_serving": 650},
                                  {**DISH, "diet_type": "sport", "kcal_per_serving": 550}]})


def _run(agent):
    return agent._run("tarea", {}, DishOptions, UserPreferences())


def test_error_de_api_pasa_al_plan_b():
    main, backup = Boom(), Fake([OPTIONS])
    agent = MealAgent(llm=main, shopping_llm=backup)
    agent.backup = backup
    assert len(_run(agent).options) == 3
    assert main.calls == 1 and backup.calls == 1


def test_respuestas_invalidas_pasan_al_plan_b():
    main, backup = Fake(["no json"] * 3), Fake([OPTIONS])
    agent = MealAgent(llm=main)
    agent.backup = backup
    assert len(_run(agent).options) == 3
    assert main.calls == 3 and backup.calls == 1


def test_sin_plan_b_el_error_se_propaga():
    agent = MealAgent(llm=Boom())
    try:
        _run(agent)
        assert False
    except RuntimeError:
        pass


def test_chat_usa_plan_b():
    agent = MealAgent(llm=Boom())
    agent.backup = Fake(["hola"])
    assert agent.chat([{"role": "user", "content": "hi"}]) == "hola"
