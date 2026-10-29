from typing import Optional
from pydantic import BaseModel, ConfigDict


class PantryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    quantity: Optional[str] = None  # texto libre: "6 huevos", "500 g"


class PantryItemOut(PantryItem):
    id: int
