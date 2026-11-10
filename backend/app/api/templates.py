import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.shopping_template import ShoppingTemplateModel
from app.models.user import UserModel
from app.schemas.shopping import ShoppingItem

router = APIRouter(prefix="/templates", tags=["templates"])

MAX_TEMPLATES = 30


class TemplateIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    items: list[ShoppingItem] = Field(max_length=300)


class TemplateOut(TemplateIn):
    id: int


def _out(row: ShoppingTemplateModel) -> TemplateOut:
    return TemplateOut(id=row.id, name=row.name, items=json.loads(row.items or "[]"))


@router.get("", response_model=list[TemplateOut])
def list_templates(db: Session = Depends(get_db), user: UserModel = Depends(get_current_user)):
    rows = (db.query(ShoppingTemplateModel).filter(ShoppingTemplateModel.user_id == user.id)
            .order_by(ShoppingTemplateModel.name).all())
    return [_out(r) for r in rows]


@router.post("", response_model=TemplateOut)
def save_template(body: TemplateIn, db: Session = Depends(get_db),
                  user: UserModel = Depends(get_current_user)):
    """Guarda una plantilla; si ya existe una con ese nombre, la sustituye."""
    name = body.name.strip()
    if not name:
        raise HTTPException(422, "Ponle un nombre a la plantilla")
    row = (db.query(ShoppingTemplateModel)
           .filter(ShoppingTemplateModel.user_id == user.id, ShoppingTemplateModel.name == name).first())
    if row is None:
        total = db.query(ShoppingTemplateModel).filter(ShoppingTemplateModel.user_id == user.id).count()
        if total >= MAX_TEMPLATES:
            raise HTTPException(400, f"Máximo {MAX_TEMPLATES} plantillas: borra alguna para guardar otra")
        row = ShoppingTemplateModel(user_id=user.id, name=name)
    row.items = json.dumps([i.model_dump() for i in body.items], ensure_ascii=False)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _out(row)


@router.delete("/{template_id}", status_code=204)
def delete_template(template_id: int, db: Session = Depends(get_db),
                    user: UserModel = Depends(get_current_user)):
    row = db.get(ShoppingTemplateModel, template_id)
    if not row or row.user_id != user.id:
        raise HTTPException(404, "No existe")
    db.delete(row)
    db.commit()
