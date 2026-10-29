from abc import ABC, abstractmethod
from urllib.parse import quote_plus

from app.schemas.shopping import ShoppingItem


class SupermarketProvider(ABC):
    """Clase base abstracta para proveedores de supermercados."""

    name: str
    search_url: str  # URL de búsqueda de la cadena

    def link_for(self, item: ShoppingItem) -> str:
        """Genera un enlace de búsqueda para un solo item."""
        return self.search_url.format(q=quote_plus(item.name))

    @abstractmethod
    def build_links(self, items: list[ShoppingItem]) -> list[dict]:
        """Genera enlaces para una lista de items.
        
        MVP (Minimum Viable Product): un enlace de búsqueda por producto.
        Futuro: carrito real (la mayoría de cadenas no ofrecen API pública).
        """
        pass


class SearchLinkProvider(SupermarketProvider):
    """Implementación base que genera un enlace de búsqueda por producto."""

    def build_links(self, items: list[ShoppingItem]) -> list[dict]:
        """MVP: un enlace de búsqueda por producto."""
        return [
            {"item": i.name, "url": self.link_for(i)} for i in items
        ]


class Mercadona(SearchLinkProvider):
    name = "mercadona"
    search_url = "https://tienda.mercadona.es/search-results?query={q}"

    def build_links(self, items: list[ShoppingItem]) -> list[dict]:
        """Mercadona: enlaces de búsqueda con formato optimizado."""
        links = []
        for item in items:
            # Mercadona busca por nombre, podemos añadir categoría para mejores resultados
            query = f"{item.name} {item.category}" if item.category else item.name
            url = self.search_url.format(q=quote_plus(query))
            links.append({"item": item.name, "url": url})
        return links


class Carrefour(SearchLinkProvider):
    name = "carrefour"
    search_url = "https://www.carrefour.es/search-results?q={q}"

    def build_links(self, items: list[ShoppingItem]) -> list[dict]:
        """Carrefour: enlaces de búsqueda con formato optimizado."""
        links = []
        for item in items:
            query = f"{item.name} {item.category}" if item.category else item.name
            url = self.search_url.format(q=quote_plus(query))
            links.append({"item": item.name, "url": url})
        return links


class Hipercar(SearchLinkProvider):
    name = "hipercor"
    search_url = "https://www.hipcor.es/supermercado/buscar/?term={q}"

    def build_links(self, items: list[ShoppingItem]) -> list[dict]:
        """Hipercor: enlaces de búsqueda con formato optimizado."""
        links = []
        for item in items:
            query = f"{item.name} {item.category}" if item.category else item.name
            url = self.search_url.format(q=quote_plus(query))
            links.append({"item": item.name, "url": url})
        return links


# Diccionario de proveedores disponibles
PROVIDERS: dict[str, SupermarketProvider] = {
    p.name: p for p in (Mercadona(), Carrefour(), Hipercar())
}