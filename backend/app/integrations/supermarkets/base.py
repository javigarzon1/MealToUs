from abc import ABC, abstractmethod
from urllib.parse import quote_plus

from app.schemas.shopping import ShoppingItem


class SupermarketProvider(ABC):
    name: str
    search_url: str  # TODO: verifica la URL de búsqueda actual de cada tienda

    def link_for(self, item: ShoppingItem) -> str:
        return self.search_url.format(q=quote_plus(item.name))

    @abstractmethod
    def build_links(self, items: list[ShoppingItem]) -> list[dict]:
        """MVP: un enlace de búsqueda por producto.
        Futuro: carrito real (la mayoría de cadenas no ofrecen API pública)."""


class SearchLinkProvider(SupermarketProvider):
    def build_links(self, items: list[ShoppingItem]) -> list[dict]:
        return [{"item": i.name, "url": self.link_for(i)} for i in items]
