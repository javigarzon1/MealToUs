from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class DietType(str, Enum):
    healthy = "healthy"
    normal = "normal"
    sport = "sport"


class Ingredient(BaseModel):
    name: str
    quantity: float
    unit: str  # g, ml, ud, cucharada...


class Nutrition(BaseModel):
    """Información nutricional estimada de una ración."""
    protein_g: float = Field(ge=0, le=300)
    fat_g: float = Field(ge=0, le=300)
    carbs_g: float = Field(ge=0, le=600)
    fiber_g: float = Field(0, ge=0, le=100)
    # Como mucho 3-4 destacados con su cantidad, p. ej. "Vitamina C 45 mg", "Hierro 3 mg"
    micros: list[str] = Field(default=[], max_length=4)


class Dish(BaseModel):
    name: str
    diet_type: DietType
    kcal_per_serving: int
    ingredients: list[Ingredient]
    uses_from_pantry: list[str] = []
    # Opcional para que los menús guardados antes de existir este campo sigan cargando
    nutrition: Optional[Nutrition] = None


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


WEEKDAYS_ES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]


def normalize_day(value: str) -> str:
    """Nombre de día en castellano (acepta inglés, abreviaturas y sin tildes)."""
    key = value.strip().lower().rstrip(".")
    return _DAYS_ES.get(key, key)


class DayPlan(BaseModel):
    day: str
    lunch: Dish
    dinner: Dish

    @field_validator("day")
    @classmethod
    def day_in_spanish(cls, v: str) -> str:
        """Si el modelo devuelve el día en inglés, se pasa a castellano."""
        return normalize_day(v)


class WeeklyPlan(BaseModel):
    diet_type: DietType
    target_kcal_per_day: int
    days: list[DayPlan] = Field(min_length=7, max_length=7)
