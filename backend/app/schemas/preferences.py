from pydantic import BaseModel, Field


class UserPreferences(BaseModel):
    people: int = Field(1, ge=1, le=20)
    allergies: list[str] = []
    intolerances: list[str] = []
    dislikes: list[str] = []
