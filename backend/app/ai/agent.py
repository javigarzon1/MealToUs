import json
from typing import Optional

from pydantic import BaseModel

from app.ai import prompts
from app.ai.llm_client import LLMClient, get_llm_client
from app.ai.validators import extract_ingredient_names, find_conflicts
from app.schemas.menu import Dish, DishOptions, WeeklyPlan
from app.schemas.pantry import PantryItem
from app.schemas.preferences import UserPreferences
from app.schemas.requests import PlanContext
from app.schemas.shopping import ShoppingResult


class AgentError(Exception):
    pass


def extract_json(raw: str) -> dict:
    """Tolera que el modelo envuelva el JSON en ```json ... ``` o añada texto."""
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("La respuesta no contiene JSON")
    return json.loads(raw[start : end + 1])


class MealAgent:
    MAX_RETRIES = 2

    def __init__(self, llm: Optional[LLMClient] = None) -> None:
        self.llm = llm or get_llm_client()

    # ---- núcleo: pedir JSON, validar esquema + restricciones, reintentar con feedback ----
    def _run(self, task: str, payload: dict, model_cls: type[BaseModel],
             prefs: UserPreferences, max_tokens: int = 4000):
        schema = json.dumps(model_cls.model_json_schema(), ensure_ascii=False)
        user = (
            f"{task}\n\nResponde SOLO con un JSON válido que cumpla este esquema:\n{schema}"
            f"\n\nDATOS:\n{json.dumps(payload, ensure_ascii=False)}"
        )
        messages = [{"role": "user", "content": user}]
        feedback = ""
        for _ in range(self.MAX_RETRIES + 1):
            raw = self.llm.complete(prompts.SYSTEM_PROMPT, messages, max_tokens)
            try:
                result = model_cls.model_validate(extract_json(raw))
                conflicts = find_conflicts(extract_ingredient_names(result), prefs)
                if not conflicts:
                    return result
                feedback = "Estos ingredientes incumplen las restricciones: " + "; ".join(conflicts)
            except ValueError as exc:  # incluye JSONDecodeError y ValidationError
                feedback = f"Tu respuesta no es válida: {exc}"
            messages += [
                {"role": "assistant", "content": raw},
                {"role": "user", "content": feedback + ". Corrígelo y responde solo con JSON."},
            ]
        raise AgentError(f"No se obtuvo una respuesta válida del LLM. Último error: {feedback}")

    @staticmethod
    def _base(pantry: list[PantryItem], prefs: UserPreferences) -> dict:
        return {
            "despensa": [p.model_dump() for p in pantry],
            "preferencias": prefs.model_dump(),
        }

    # ---- pasos del flujo ----
    def propose_lunch_options(self, ctx: PlanContext) -> DishOptions:
        return self._run(prompts.TASK_LUNCH, self._base(ctx.pantry, ctx.preferences),
                         DishOptions, ctx.preferences)

    def propose_dinner_options(self, ctx: PlanContext, chosen_lunch: Dish) -> DishOptions:
        task = prompts.TASK_DINNER.format(lunch=chosen_lunch.model_dump_json())
        return self._run(task, self._base(ctx.pantry, ctx.preferences),
                         DishOptions, ctx.preferences)

    def build_weekly_plan(self, ctx: PlanContext, lunch: Dish, dinner: Dish) -> WeeklyPlan:
        kcal = lunch.kcal_per_serving + dinner.kcal_per_serving
        task = prompts.TASK_WEEKLY.format(
            diet=lunch.diet_type.value, kcal=kcal, lunch=lunch.name, dinner=dinner.name,
        )
        return self._run(task, self._base(ctx.pantry, ctx.preferences),
                         WeeklyPlan, ctx.preferences, max_tokens=8000)

    def build_shopping_and_recipes(self, ctx: PlanContext, plan: WeeklyPlan) -> ShoppingResult:
        task = prompts.TASK_SHOPPING.format(people=ctx.preferences.people)
        payload = {**self._base(ctx.pantry, ctx.preferences), "menu": plan.model_dump(mode="json")}
        return self._run(task, payload, ShoppingResult, ctx.preferences, max_tokens=8000)

    def chat(self, messages: list[dict], context: Optional[PlanContext] = None) -> str:
        system = prompts.CHAT_SYSTEM_PROMPT
        if context:
            system += "\n\nContexto del usuario:\n" + context.model_dump_json()
        return self.llm.complete(system, messages, max_tokens=1500)
