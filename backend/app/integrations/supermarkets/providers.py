from app.integrations.supermarkets.base import SearchLinkProvider, SupermarketProvider


class Mercadona(SearchLinkProvider):
    name = "mercadona"
    search_url = "https://tienda.mercadona.es/search-results?query={q}"  # verificar


class Carrefour(SearchLinkProvider):
    name = "carrefour"
    search_url = "https://www.carrefour.es/?q={q}"  # verificar


class Hipercor(SearchLinkProvider):
    name = "hipercor"
    search_url = "https://www.hipercor.es/supermercado/buscar/?term={q}"  # verificar


PROVIDERS: dict[str, SupermarketProvider] = {p.name: p for p in (Mercadona(), Carrefour(), Hipercor())}
