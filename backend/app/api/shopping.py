from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.integrations.supermarkets.providers import PROVIDERS
from app.schemas.shopping import ShoppingItem

router = APIRouter(prefix="/shopping", tags=["shopping"])


class LinksRequest(BaseModel):
    supermarket: str  # mercadona | carrefour | hipercor
    items: list[ShoppingItem]


@router.post("/supermarket-links")
def supermarket_links(req: LinksRequest):
    provider = PROVIDERS.get(req.supermarket)
    if not provider:
        raise HTTPException(400, f"Supermercado no soportado. Opciones: {list(PROVIDERS)}")
    return {"supermarket": provider.name, "links": provider.build_links(req.items)}
