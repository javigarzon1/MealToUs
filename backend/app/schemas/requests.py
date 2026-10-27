from pydantic import BaseModel

from app.schemas.menu import Dish, WeeklyPlan
from app.schemas.pantry import PantryItem
from app.schemas.preferences import UserPreferences


class PlanContext(BaseModel):
    pantry: list[PantryItem] = []
    preferences: UserPreferences = UserPreferences()


class DinnerRequest(PlanContext):
    chosen_lunch: Dish


class WeeklyPlanRequest(PlanContext):
    chosen_lunch: Dish
    chosen_dinner: Dish


class ShoppingRequest(PlanContext):
    plan: WeeklyPlan


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: PlanContext | None = None
