from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class MenuHistoryModel(Base):
    """Cada menú semanal generado se anota aquí; se conservan los últimos de cada usuario."""
    __tablename__ = "menu_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    plan: Mapped[str] = mapped_column()  # JSON de WeeklyPlan
