from enum import Enum

from pydantic import BaseModel, Field, field_validator


class DietType(str, Enum):
    healthy = "healthy"
    normal = "normal"
    sport = "sport"


class Ingredient(BaseModel):
    name: str
    quantity: float
    unit: str  # g, ml, ud, cucharada...


class Dish(BaseModel):
    name: str
    diet_type: DietType
    kcal_per_serving: int
    ingredients: list[Ingredient]
    uses_from_pantry: list[str] = []


class DishOptions(BaseModel):
    """Exactamente 3 opciones: healthy, normal y sport (una de cada)."""
    options: list[Dish] = Field(min_length=3, max_length=3)


_DAYS_ES = {
    "monday": "lunes", "tuesday": "martes", "wednesday": "miércoles", "thursday": "jueves",
    "friday": "viernes", "saturday": "sábado", "sunday": "domingo",
    "mon": "lunes", "tue": "martes", "wed": "miércoles", "thu": "jueves",
    "fri": "viernes", "sat": "sábado", "sun": "domingo",
    "miercoles": "miércoles", "sabado": "sábado",
}


class DayPlan(BaseModel):
    day: str
    lunch: Dish
    dinner: Dish

    @field_validator("day")
    @classmethod
    def day_in_spanish(cls, v: str) -> str:
        """Si el modelo devuelve el día en inglés, se pasa a castellano."""
        key = v.strip().lower().rstrip(".")
        return _DAYS_ES.get(key, key)


class WeeklyPlan(BaseModel):
    diet_type: DietType
    target_kcal_per_day: int
    days: list[DayPlan] = Field(min_length=7, max_length=7)
