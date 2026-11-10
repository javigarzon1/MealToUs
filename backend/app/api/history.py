import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.menu_history import MenuHistoryModel
from app.models.user import UserModel
from app.schemas.menu import WeeklyPlan

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/history", tags=["history"])

MAX_HISTORY = 10


class HistoryOut(BaseModel):
    id: int
    created_at: datetime
    plan: WeeklyPlan


def record_menu(db: Session, user_id: int, plan: WeeklyPlan) -> None:
    """Anota un menú recién generado y recorta el historial. Nunca rompe la petición."""
    try:
        db.add(MenuHistoryModel(user_id=user_id, plan=plan.model_dump_json()))
        db.flush()
        old = (db.query(MenuHistoryModel.id).filter(MenuHistoryModel.user_id == user_id)
               .order_by(MenuHistoryModel.id.desc()).offset(MAX_HISTORY).all())
        if old:
            db.query(MenuHistoryModel).filter(MenuHistoryModel.id.in_([i for (i,) in old])
                                              ).delete(synchronize_session=False)
        db.commit()
    except Exception:  # el historial es un extra: si falla, el menú se entrega igual
        db.rollback()
        logger.exception("No se pudo anotar el menú en el historial")


@router.get("", response_model=list[HistoryOut])
def list_history(db: Session = Depends(get_db), user: UserModel = Depends(get_current_user)):
    rows = (db.query(MenuHistoryModel).filter(MenuHistoryModel.user_id == user.id)
            .order_by(MenuHistoryModel.id.desc()).limit(MAX_HISTORY).all())
    # SQLite devuelve fechas sin zona: se tratan como UTC para que el navegador las ajuste bien
    return [HistoryOut(id=r.id, created_at=r.created_at.replace(tzinfo=r.created_at.tzinfo or timezone.utc),
                       plan=WeeklyPlan.model_validate_json(r.plan))
            for r in rows]


@router.delete("/{history_id}", status_code=204)
def delete_history(history_id: int, db: Session = Depends(get_db),
                   user: UserModel = Depends(get_current_user)):
    row = db.get(MenuHistoryModel, history_id)
    if not row or row.user_id != user.id:
        raise HTTPException(404, "No existe")
    db.delete(row)
    db.commit()
