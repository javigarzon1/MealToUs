from pydantic import BaseModel

from app.schemas.menu import Ingredient


class ShoppingItem(BaseModel):
    name: str
    quantity: float
    unit: str
    category: str  # frutas, carnes, lácteos, despensa...


class Recipe(BaseModel):
    dish_name: str
    servings: int
    prep_minutes: int
    ingredients: list[Ingredient]
    steps: list[str]


class ShoppingResult(BaseModel):
    shopping_list: list[ShoppingItem]
    recipes: list[Recipe]
