from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.pantry import PantryItemModel
from app.models.user import UserModel
from app.schemas.pantry import PantryItem, PantryItemOut

router = APIRouter(prefix="/pantry", tags=["pantry"])


@router.get("", response_model=list[PantryItemOut])
def list_items(db: Session = Depends(get_db), user: UserModel = Depends(get_current_user)):
    return db.query(PantryItemModel).filter(PantryItemModel.user_id == user.id).all()


@router.post("", response_model=PantryItemOut, status_code=201)
def add_item(item: PantryItem, db: Session = Depends(get_db),
             user: UserModel = Depends(get_current_user)):
    row = PantryItemModel(**item.model_dump(), user_id=user.id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db),
                user: UserModel = Depends(get_current_user)):
    row = db.get(PantryItemModel, item_id)
    if not row or row.user_id != user.id:  # los ajenos tampoco "existen"
        raise HTTPException(404, "No existe")
    db.delete(row)
    db.commit()
