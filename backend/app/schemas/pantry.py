from pydantic import BaseModel, ConfigDict


class PantryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    quantity: str | None = None  # texto libre: "6 huevos", "500 g"


class PantryItemOut(PantryItem):
    id: int
