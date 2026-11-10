from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class ShoppingTemplateModel(Base):
    """Lista de la compra guardada por un usuario para reutilizarla."""
    __tablename__ = "shopping_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column()
    items: Mapped[str] = mapped_column(default="[]")  # JSON de ShoppingItem
