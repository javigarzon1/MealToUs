"""Foto de la despensa: reconocimiento, confirmaciones y repetir foto."""
import base64
import json

from app.ai.vision import build_result, normalize_unit, scan_image

PIXEL = base64.b64encode(b"\xff\xd8\xff\xe0fake-jpeg").decode()


class FakeVision:
    def __init__(self, replies):
        self.replies = list(replies)
        self.calls = 0

    def describe_image(self, system, text, image_b64, mime, max_tokens=1500):
        self.calls += 1
        return self.replies.pop(0)


def reply(quality="ok", items=(), advice=""):
    return json.dumps({"quality": quality, "advice": advice, "items": list(items)})


def test_alimentos_claros_no_piden_confirmar():
    res = build_result(json.loads(reply(items=[
        {"name": "Leche", "quantity": 2, "unit": "l", "confidence": "alta"}])))
    assert res.status == "ok"
    assert res.items[0].needs_confirmation is False


def test_pide_confirmar_unidad_cantidad_o_poca_confianza():
    res = build_result(json.loads(reply(items=[
        {"name": "huevos", "quantity": None, "unit": "ud", "confidence": "alta"},
        {"name": "arroz", "quantity": 1, "unit": "cucharón", "confidence": "alta"},
        {"name": "tomate", "quantity": 3, "unit": "ud", "confidence": "baja"},
    ])))
    assert [i.needs_confirmation for i in res.items] == [True, True, True]
    assert res.items[1].unit is None


def test_foto_mala_pide_repetir():
    for q in ("blurry", "dark", "too_far", "not_food"):
        res = build_result(json.loads(reply(quality=q)))
        assert res.status == "retake" and res.message
    assert build_result({"quality": "ok", "items": []}).status == "retake"


def test_unidades_y_duplicados():
    assert normalize_unit("Litros") == "l" and normalize_unit("latas") == "ud" and normalize_unit("raro") is None
    res = build_result({"items": [{"name": "Pan", "quantity": 1, "unit": "ud"},
                                  {"name": "pan", "quantity": 2, "unit": "ud"}, {"name": ""}]})
    assert len(res.items) == 1


def test_respuesta_no_json_reintenta_y_luego_pide_repetir():
    ok = FakeVision(["no es json", reply(items=[{"name": "pan", "quantity": 1, "unit": "ud", "confidence": "alta"}])])
    assert scan_image(ok, PIXEL, "image/jpeg").status == "ok" and ok.calls == 2
    bad = FakeVision(["x", "y"])
    assert scan_image(bad, PIXEL, "image/jpeg").status == "retake"


def test_endpoint_scan(auth_client, monkeypatch):
    fake = FakeVision([reply(items=[{"name": "queso", "quantity": 200, "unit": "g", "confidence": "media"}])])
    monkeypatch.setattr("app.api.pantry.get_vision_client", lambda: fake)
    res = auth_client.post("/api/pantry/scan", json={"image": PIXEL, "mime": "image/jpeg"})
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok" and body["items"][0]["needs_confirmation"] is True
    assert auth_client.get("/api/pantry").json() == []  # no guarda nada por sí solo


def test_endpoint_scan_errores(auth_client, monkeypatch):
    monkeypatch.setattr("app.api.pantry.get_vision_client", lambda: None)
    assert auth_client.post("/api/pantry/scan", json={"image": PIXEL}).status_code == 503
    monkeypatch.setattr("app.api.pantry.get_vision_client", lambda: FakeVision([]))
    assert auth_client.post("/api/pantry/scan", json={"image": PIXEL, "mime": "image/gif"}).status_code == 400
    assert auth_client.post("/api/pantry/scan", json={"image": "%%%"}).status_code == 400
    big = "A" * (6 * 1024 * 1024)
    assert auth_client.post("/api/pantry/scan", json={"image": big}).status_code == 413


def test_endpoint_scan_exige_sesion(client):
    assert client.post("/api/pantry/scan", json={"image": PIXEL}).status_code == 401
