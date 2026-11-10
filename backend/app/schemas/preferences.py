from typing import Optional

from pydantic import BaseModel, Field


class UserPreferences(BaseModel):
    people: int = Field(1, ge=1, le=20)
    allergies: list[str] = []
    intolerances: list[str] = []
    dislikes: list[str] = []
    # Tope de kcal al día (comida + cena). None = sin límite
    max_kcal_per_day: Optional[int] = Field(None, ge=1000, le=6000)
