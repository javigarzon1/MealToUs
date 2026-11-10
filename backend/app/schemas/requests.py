from typing import Optional
from pydantic import BaseModel, field_validator

from app.schemas.menu import WEEKDAYS_ES, Dish, WeeklyPlan, normalize_day
from app.schemas.pantry import PantryItem
from app.schemas.preferences import UserPreferences
from app.schemas.shopping import Recipe


class PlanContext(BaseModel):
    pantry: list[PantryItem] = []
    preferences: UserPreferences = UserPreferences()


class DinnerRequest(PlanContext):
    chosen_lunch: Dish


class WeeklyPlanRequest(PlanContext):
    chosen_lunch: Dish
    chosen_dinner: Dish
    start_day: Optional[str] = None  # día de la semana en el que empieza el menú

    @field_validator("start_day")
    @classmethod
    def valid_start_day(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None
        day = normalize_day(v)
        if day not in WEEKDAYS_ES:
            raise ValueError("El día de inicio debe ser un día de la semana (lunes, martes...)")
        return day


class ShoppingRequest(PlanContext):
    plan: WeeklyPlan


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class TodayMenu(BaseModel):
    """Lo que toca cocinar hoy según el menú semanal del usuario."""
    day: str
    lunch: Optional[Dish] = None
    dinner: Optional[Dish] = None
    recipes: list[Recipe] = []


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: Optional[PlanContext] = None
    today: Optional[TodayMenu] = None
