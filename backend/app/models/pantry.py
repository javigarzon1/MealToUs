from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class PantryItemModel(Base):
    __tablename__ = "pantry_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(index=True)
    quantity: Mapped[str | None] = mapped_column(default=None)
