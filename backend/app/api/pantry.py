from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.pantry import PantryItemModel
from app.schemas.pantry import PantryItem, PantryItemOut

router = APIRouter(prefix="/pantry", tags=["pantry"])


@router.get("", response_model=list[PantryItemOut])
def list_items(db: Session = Depends(get_db)):
    return db.query(PantryItemModel).all()


@router.post("", response_model=PantryItemOut, status_code=201)
def add_item(item: PantryItem, db: Session = Depends(get_db)):
    row = PantryItemModel(**item.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    row = db.get(PantryItemModel, item_id)
    if not row:
        raise HTTPException(404, "No existe")
    db.delete(row)
    db.commit()
