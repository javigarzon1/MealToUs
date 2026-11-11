import json
from typing import Callable, Optional

from pydantic import BaseModel

from app.ai import prompts
from app.ai.llm_client import LLMClient, get_llm_client, get_shopping_llm_client
from app.ai.nutrition import (
    LABEL, RANGES, dinner_bounds, kcal_problems, lunch_bounds, lunch_cap, nutrition_problems,
)
from app.ai.validators import extract_ingredient_names, find_conflicts
from app.schemas.menu import WEEKDAYS_ES, DietType, Dish, DishOptions, WeeklyPlan
from app.schemas.pantry import PantryItem
from app.schemas.preferences import UserPreferences
from app.schemas.requests import PlanContext, TodayMenu
from app.schemas.shopping import RecipeList, ShoppingList, ShoppingResult


class AgentError(Exception):
    pass


def _ranges_text(bounds: dict) -> str:
    return "; ".join(f"{d.value} ({LABEL[d.value]}) entre {lo} y {hi} kcal" for d, (lo, hi) in bounds.items())


def _compact_schema(model_cls: type[BaseModel]) -> str:
    """Esquema JSON sin los 'title' (ruido) y sin espacios: ocupa ~30 % menos tokens."""
    def strip(o):
        if isinstance(o, dict):
            return {k: strip(v) for k, v in o.items() if k != "title"}
        if isinstance(o, list):
            return [strip(v) for v in o]
        return o
    return json.dumps(strip(model_cls.model_json_schema()), ensure_ascii=False, separators=(",", ":"))


def extract_json(raw: str) -> dict:
    """Tolera que el modelo envuelva el JSON en ```json ... ``` o añada texto."""
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("La respuesta no contiene JSON")
    return json.loads(raw[start : end + 1])


class MealAgent:
    MAX_RETRIES = 2

    def __init__(self, llm: Optional[LLMClient] = None,
                 shopping_llm: Optional[LLMClient] = None) -> None:
        self.llm = llm or get_llm_client()
        # Segundo proveedor solo para la lista de la compra; si no hay, se usa el principal
        if shopping_llm is None and llm is None:
            shopping_llm = get_shopping_llm_client()
        self.shopping_llm = shopping_llm or self.llm

    # ---- núcleo: pedir JSON, validar esquema + restricciones, reintentar con feedback ----
    def _run(self, task: str, payload: dict, model_cls: type[BaseModel],
             prefs: UserPreferences, max_tokens: int = 4000,
             llm: Optional[LLMClient] = None,
             check: Optional[Callable[[BaseModel], list[str]]] = None):
        schema = _compact_schema(model_cls)
        user = (
            f"{task}\n\nResponde SOLO con un JSON válido que cumpla este esquema:\n{schema}"
            f"\n\nDATOS:\n{json.dumps(payload, ensure_ascii=False)}"
        )
        messages = [{"role": "user", "content": user}]
        feedback = ""
        for _ in range(self.MAX_RETRIES + 1):
            raw = (llm or self.llm).complete(prompts.SYSTEM_PROMPT, messages, max_tokens)
            try:
                result = model_cls.model_validate(extract_json(raw))
                conflicts = find_conflicts(extract_ingredient_names(result), prefs)
                if conflicts:
                    feedback = "Estos ingredientes incumplen las restricciones: " + "; ".join(conflicts)
                else:
                    problems = check(result) if check else []
                    if not problems:
                        return result
                    feedback = "Incumples los límites de calorías o nutrición: " + "; ".join(problems)
            except ValueError as exc:  # incluye JSONDecodeError y ValidationError
                feedback = f"Tu respuesta no es válida: {exc}"
            # Se reenvía la petición original con el motivo del rechazo, NO la respuesta fallida
            # entera: en un reintento duplicaría los tokens y reventaría el límite por minuto.
            messages = [{"role": "user", "content":
                         f"{user}\n\nTU RESPUESTA ANTERIOR FUE RECHAZADA: {feedback[:700]}. "
                         "Corrígelo y responde solo con JSON."}]
        raise AgentError(f"No se obtuvo una respuesta válida del LLM. Último error: {feedback}")

    @staticmethod
    def _base(pantry: list[PantryItem], prefs: UserPreferences) -> dict:
        return {
            "despensa": [p.model_dump() for p in pantry],
            "preferencias": prefs.model_dump(),
        }

    # ---- pasos del flujo ----
    def propose_lunch_options(self, ctx: PlanContext) -> DishOptions:
        max_kcal = ctx.preferences.max_kcal_per_day
        bounds = {d: lunch_bounds(d, max_kcal) for d in DietType}
        task = prompts.TASK_LUNCH + prompts.LUNCH_RANGES.format(ranges=_ranges_text(bounds))
        if max_kcal:
            task += prompts.LUNCH_CAP.format(cap=lunch_cap(max_kcal), day=max_kcal)

        def check(r: DishOptions) -> list[str]:
            problems: list[str] = []
            for d in r.options:
                problems += kcal_problems(d, *bounds[d.diet_type]) + nutrition_problems(d)
            return problems

        return self._run(task, self._base(ctx.pantry, ctx.preferences),
                         DishOptions, ctx.preferences, check=check)

    def propose_dinner_options(self, ctx: PlanContext, chosen_lunch: Dish) -> DishOptions:
        # La cena respeta el rango de su tipo, es más ligera que la comida y cabe en el tope diario
        max_kcal = ctx.preferences.max_kcal_per_day
        bounds = {d: dinner_bounds(d, chosen_lunch.kcal_per_serving, max_kcal) for d in DietType}
        task = prompts.TASK_DINNER.format(lunch=chosen_lunch.model_dump_json(), ranges=_ranges_text(bounds))

        def check(r: DishOptions) -> list[str]:
            problems: list[str] = []
            for d in r.options:
                problems += kcal_problems(d, *bounds[d.diet_type]) + nutrition_problems(d)
            return problems

        return self._run(task, self._base(ctx.pantry, ctx.preferences),
                         DishOptions, ctx.preferences, check=check)

    def build_weekly_plan(self, ctx: PlanContext, lunch: Dish, dinner: Dish,
                          start_day: Optional[str] = None) -> WeeklyPlan:
        max_kcal = ctx.preferences.max_kcal_per_day
        kcal = lunch.kcal_per_serving + dinner.kcal_per_serving
        if max_kcal:
            kcal = min(kcal, max_kcal)
        start = start_day or WEEKDAYS_ES[0]
        lo, hi = lunch_bounds(lunch.diet_type, max_kcal)
        dinner_hi = RANGES[lunch.diet_type.value][1]
        task = prompts.TASK_WEEKLY.format(
            diet=lunch.diet_type.value, kcal=kcal, lunch=lunch.name, dinner=dinner.name,
            start=start, lo=lo, hi=hi, dhi=dinner_hi,
            cap=prompts.WEEKLY_CAP.format(max=max_kcal) if max_kcal else "",
        )

        def check(plan: WeeklyPlan) -> list[str]:
            problems: list[str] = []
            for d in plan.days:
                l, n = d.lunch.kcal_per_serving, d.dinner.kcal_per_serving
                if not lo <= l <= hi:
                    problems.append(f"{d.day}: la comida tiene {l} kcal y debe estar entre {lo} y {hi}")
                if n >= l or n > dinner_hi:
                    problems.append(f"{d.day}: la cena ({n} kcal) debe ser más ligera que la comida "
                                    f"({l} kcal) y no pasar de {dinner_hi}")
                if max_kcal and l + n > max_kcal:
                    problems.append(f"{d.day}: {l + n} kcal supera el tope de {max_kcal}")
                problems += nutrition_problems(d.lunch) + nutrition_problems(d.dinner)
            return problems

        plan = self._run(task, self._base(ctx.pantry, ctx.preferences),
                         WeeklyPlan, ctx.preferences, max_tokens=5000, check=check)
        # Los nombres de día los pone el código: siempre 7 seguidos desde el día elegido
        first = WEEKDAYS_ES.index(start)
        for i, day in enumerate(plan.days):
            day.day = WEEKDAYS_ES[(first + i) % 7]
        if max_kcal:
            plan.target_kcal_per_day = min(plan.target_kcal_per_day, max_kcal)
        return plan

    def build_shopping_and_recipes(self, ctx: PlanContext, plan: WeeklyPlan) -> ShoppingResult:
        """Dos peticiones pequeñas: la lista (proveedor de la compra) y las recetas (principal)."""
        people = ctx.preferences.people
        menu = plan.model_dump(mode="json")
        for day in menu["days"]:  # la nutrición no hace falta para comprar ni para las recetas
            for meal in (day["lunch"], day["dinner"]):
                meal.pop("nutrition", None)

        list_payload = {**self._base(ctx.pantry, ctx.preferences), "menu": menu}
        shopping = self._run(prompts.TASK_SHOPPING_LIST.format(people=people), list_payload,
                             ShoppingList, ctx.preferences, max_tokens=2500, llm=self.shopping_llm)

        # Las recetas solo necesitan los platos distintos del menú, no la despensa
        dishes = {}
        for day in menu["days"]:
            for meal in (day["lunch"], day["dinner"]):
                dishes.setdefault(meal["name"], meal)
        recipes_payload = {"platos": list(dishes.values()), "preferencias": ctx.preferences.model_dump()}
        recipes = self._run(prompts.TASK_RECIPES.format(people=people), recipes_payload,
                            RecipeList, ctx.preferences, max_tokens=5000)

        return ShoppingResult(shopping_list=shopping.shopping_list, recipes=recipes.recipes)

    def chat(self, messages: list[dict], context: Optional[PlanContext] = None,
             today: Optional[TodayMenu] = None) -> str:
        system = prompts.CHAT_SYSTEM_PROMPT
        if context:
            system += "\n\nContexto del usuario:\n" + context.model_dump_json()
        if today:
            system += prompts.CHAT_TODAY.format(day=today.day, today=today.model_dump_json())
        return self.llm.complete(system, messages, max_tokens=2000)
