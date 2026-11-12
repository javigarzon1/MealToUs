import base64
import binascii
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.ai.llm_client import get_vision_client
from app.ai.vision import ScanResult, scan_image

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.pantry import PantryItemModel
from app.models.user import UserModel
from app.schemas.pantry import PantryItem, PantryItemOut

router = APIRouter(prefix="/pantry", tags=["pantry"])
logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 5 * 1024 * 1024
IMAGE_TYPES = ("image/jpeg", "image/png", "image/webp")


class ScanRequest(BaseModel):
    image: str  # base64, con o sin prefijo data:
    mime: str = "image/jpeg"


@router.post("/scan", response_model=ScanResult)
def scan_photo(req: ScanRequest):
    """Identifica los alimentos de una foto. No guarda nada: el usuario confirma antes de añadir."""
    if req.mime not in IMAGE_TYPES:
        raise HTTPException(400, "Formato no admitido. Usa una foto JPG, PNG o WebP.")
    data = req.image.split(",", 1)[1] if req.image.startswith("data:") else req.image
    if len(data) > MAX_IMAGE_BYTES * 4 // 3 + 16:
        raise HTTPException(413, "La foto es demasiado grande (máximo 5 MB).")
    try:
        base64.b64decode(data, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(400, "La imagen no es válida. Prueba con otra foto.")
    client = get_vision_client()
    if client is None:
        raise HTTPException(
            503,
            "Reconocer fotos necesita un modelo con visión. Configura SHOPPING_LLM_* con Gemini "
            "(gemini-3.5-flash-lite) en backend/.env.",
        )
    try:
        return scan_image(client, data, req.mime)
    except Exception as exc:  # clave inválida, sin red, cuota agotada...
        logger.exception("Error analizando la foto")
        raise HTTPException(502, f"Error al analizar la foto ({type(exc).__name__}): "
                                 f"{' '.join(str(exc).split())[:300]}")


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
