from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.favorite_menu import FavoriteMenuModel
from app.models.user import UserModel
from app.schemas.menu import WeeklyPlan

router = APIRouter(prefix="/favorites", tags=["favorites"])

MAX_FAVORITES = 20


class FavoriteIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    plan: WeeklyPlan


class FavoriteOut(FavoriteIn):
    id: int


def _out(row: FavoriteMenuModel) -> FavoriteOut:
    return FavoriteOut(id=row.id, name=row.name, plan=WeeklyPlan.model_validate_json(row.plan))


@router.get("", response_model=list[FavoriteOut])
def list_favorites(db: Session = Depends(get_db), user: UserModel = Depends(get_current_user)):
    rows = (db.query(FavoriteMenuModel).filter(FavoriteMenuModel.user_id == user.id)
            .order_by(FavoriteMenuModel.name).all())
    return [_out(r) for r in rows]


@router.post("", response_model=FavoriteOut)
def save_favorite(body: FavoriteIn, db: Session = Depends(get_db),
                  user: UserModel = Depends(get_current_user)):
    """Guarda un menú; si ya hay uno con ese nombre, lo sustituye."""
    name = body.name.strip()
    if not name:
        raise HTTPException(422, "Ponle un nombre al menú")
    row = (db.query(FavoriteMenuModel)
           .filter(FavoriteMenuModel.user_id == user.id, FavoriteMenuModel.name == name).first())
    if row is None:
        total = db.query(FavoriteMenuModel).filter(FavoriteMenuModel.user_id == user.id).count()
        if total >= MAX_FAVORITES:
            raise HTTPException(400, f"Máximo {MAX_FAVORITES} menús favoritos: borra alguno para guardar otro")
        row = FavoriteMenuModel(user_id=user.id, name=name)
    row.plan = body.plan.model_dump_json()
    db.add(row)
    db.commit()
    db.refresh(row)
    return _out(row)


@router.delete("/{favorite_id}", status_code=204)
def delete_favorite(favorite_id: int, db: Session = Depends(get_db),
                    user: UserModel = Depends(get_current_user)):
    row = db.get(FavoriteMenuModel, favorite_id)
    if not row or row.user_id != user.id:
        raise HTTPException(404, "No existe")
    db.delete(row)
    db.commit()
