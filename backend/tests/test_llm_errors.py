"""Los fallos del LLM se devuelven como 502 con el motivo del proveedor, sin claves."""
from app.api.deps import get_agent
from app.main import app


class BadRequestError(Exception):
    message = "Your credit balance is too low. Key sk-ant-api03-ABCDEFGHIJKLMNOP leaked?"


class _Agent:
    def propose_lunch_options(self, req):
        raise BadRequestError()


def test_llm_error_shows_reason_without_secrets(auth_client):
    app.dependency_overrides[get_agent] = lambda: _Agent()
    try:
        body = {"pantry": [{"name": "huevos"}],
                "preferences": {"people": 1, "allergies": [], "intolerances": [], "dislikes": []}}
        r = auth_client.post("/api/menus/lunch-options", json=body)
    finally:
        app.dependency_overrides.pop(get_agent, None)
    assert r.status_code == 502
    detail = r.json()["detail"]
    assert "BadRequestError" in detail and "credit balance is too low" in detail
    assert "sk-ant" not in detail and "ABCDEFGHIJKLMNOP" not in detail
