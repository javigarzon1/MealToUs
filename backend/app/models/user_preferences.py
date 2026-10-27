from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class UserPreferencesModel(Base):
    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(primary_key=True)
    people: Mapped[int] = mapped_column(default=1)
    allergies: Mapped[str] = mapped_column(default="[]")  # JSON string
    intolerances: Mapped[str] = mapped_column(default="[]")  # JSON string
    dislikes: Mapped[str] = mapped_column(default="[]")  # JSON string