from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class FavoriteMenuModel(Base):
    """Menú semanal que el usuario quiere conservar para volver a usarlo."""
    __tablename__ = "favorite_menus"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column()
    plan: Mapped[str] = mapped_column()  # JSON de WeeklyPlan
