"""Tests del endpoint de enlaces de supermercado (requiere sesión)."""


def _make_shopping_item(name, quantity, unit, category):
    """Helper para crear un diccionario de ShoppingItem."""
    return {"name": name, "quantity": quantity, "unit": unit, "category": category}


def test_supermarket_links_mercadona(auth_client):
    """Test endpoint /api/shopping/supermarket-links con Mercadona."""
    items = [
        _make_shopping_item("tomate", 1, "kg", "frutas"),
        _make_shopping_item("pollo", 2, "ud", "carnes"),
    ]
    
    response = auth_client.post(
        "/api/shopping/supermarket-links",
        json={"supermarket": "mercadona", "items": items}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["supermarket"] == "mercadona"
    assert len(data["links"]) == 2
    # Verificar que los links tienen URL y item
    for link in data["links"]:
        assert "url" in link
        assert "item" in link


def test_supermarket_links_carrefour(auth_client):
    """Test endpoint con Carrefour."""
    items = [
        _make_shopping_item("leche", 1, "litro", "lácteos"),
        _make_shopping_item("pan", 1, "unidad", "despensa"),
    ]
    
    response = auth_client.post(
        "/api/shopping/supermarket-links",
        json={"supermarket": "carrefour", "items": items}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["supermarket"] == "carrefour"
    assert len(data["links"]) == 2


def test_supermarket_links_hipercor(auth_client):
    """Test endpoint con Hipercor."""
    items = [
        _make_shopping_item("aceite", 1, "litro", "lácteos"),
    ]
    
    response = auth_client.post(
        "/api/shopping/supermarket-links",
        json={"supermarket": "hipercor", "items": items}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["supermarket"] == "hipercor"
    assert len(data["links"]) == 1
    assert data["links"][0]["url"].startswith("https://www.hipercor.es/")


def test_supermarket_links_invalid(auth_client):
    """Test endpoint con supermercado no soportado."""
    items = [
        _make_shopping_item("huevo", 1, "ud", "lácteos"),
    ]
    
    response = auth_client.post(
        "/api/shopping/supermarket-links",
        json={"supermarket": "amazon", "items": items}
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "Supermercado no soportado" in data["detail"]


def test_supermarket_links_empty_items(auth_client):
    """Test endpoint con lista de items vacía."""
    response = auth_client.post(
        "/api/shopping/supermarket-links",
        json={"supermarket": "mercadona", "items": []}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["links"] == []

EXPECTED_URLS = {
    "carrefour": "https://www.carrefour.es/?query=leche",
    "hipercor": "https://www.hipercor.es/",
    "lidl": "https://www.lidl.es/q/search?q=leche",
    "dia": "https://www.dia.es/search?q=leche",
    "aldi": "https://www.google.com/search?q=site%3Aaldi.es+leche",
}


def test_supermarket_links_todas_las_cadenas(auth_client):
    """Cada cadena genera el enlace de búsqueda esperado (solo el nombre del producto)."""
    items = [_make_shopping_item("leche", 1, "l", "lácteos")]
    for name, expected in EXPECTED_URLS.items():
        res = auth_client.post("/api/shopping/supermarket-links", json={"supermarket": name, "items": items})
        assert res.status_code == 200, name
        url = res.json()["links"][0]["url"]
        assert url.startswith(expected) if name == "hipercor" else url == expected, (name, url)
