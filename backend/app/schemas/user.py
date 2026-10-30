from typing import Optional

from pydantic import BaseModel, ConfigDict


class UserOut(BaseModel):
    """Datos públicos de un usuario (nunca incluye la contraseña)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: Optional[str] = None
