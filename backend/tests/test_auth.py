from app.core.config import settings
from app.core.security import decode_access_token, hash_password, verify_password
from tests.conftest import CREDS


def test_hash_roundtrip():
    h = hash_password("secreto-123")
    assert h.startswith("scrypt$") and "secreto-123" not in h
    assert verify_password("secreto-123", h)
    assert not verify_password("otro", h)
    assert not verify_password("x", "sha256-antiguo")


def test_forged_token_rejected():
    assert decode_access_token("no.es.un.token") is None


def test_register_sets_httponly_cookie_and_me(client):
    r = client.post("/api/auth/register", json=CREDS)
    assert r.status_code == 201
    assert "hashed_password" not in r.json() and "password" not in r.json()
    assert "httponly" in r.headers["set-cookie"].lower()
    assert client.get("/api/auth/me").json()["email"] == CREDS["email"]


def test_duplicate_email_and_weak_password(client):
    client.post("/api/auth/register", json=CREDS)
    assert client.post("/api/auth/register", json=CREDS).status_code == 409
    weak = {"email": "c@example.com", "password": "corta"}
    assert client.post("/api/auth/register", json=weak).status_code == 422
    assert client.post("/api/auth/register", json={"email": "nope", "password": "12345678"}).status_code == 422


def test_login_logout(client):
    client.post("/api/auth/register", json=CREDS)
    client.post("/api/auth/logout")
    assert client.get("/api/auth/me").status_code == 401
    bad = client.post("/api/auth/login", json={"email": CREDS["email"], "password": "mala-clave-1"})
    assert bad.status_code == 401
    ok = client.post("/api/auth/login", json={"email": CREDS["email"].upper(), "password": CREDS["password"]})
    assert ok.status_code == 200
    assert client.get("/api/auth/me").status_code == 200


def test_unknown_email_same_error(client):
    r = client.post("/api/auth/login", json={"email": "no@example.com", "password": "lo-que-sea-1"})
    assert r.status_code == 401 and "incorrectos" in r.json()["detail"]


def test_rate_limit(client):
    client.post("/api/auth/register", json=CREDS)
    for _ in range(5):
        client.post("/api/auth/login", json={"email": CREDS["email"], "password": "mala-clave-1"})
    r = client.post("/api/auth/login", json=CREDS)
    assert r.status_code == 429


def test_registration_can_be_closed(client):
    settings.allow_registration = False
    assert client.post("/api/auth/register", json=CREDS).status_code == 403


# --- Recuperar contraseña ---

def _forgot(client, monkeypatch, email):
    """Pide el reset y devuelve el token que se habría enviado por correo."""
    sent = []
    monkeypatch.setattr("app.api.auth.send_password_reset", lambda to, token: sent.append((to, token)))
    r = client.post("/api/auth/forgot-password", json={"email": email})
    return r, sent


def test_forgot_same_answer_for_unknown_email(client, monkeypatch):
    client.post("/api/auth/register", json=CREDS)
    known, sent_known = _forgot(client, monkeypatch, CREDS["email"])
    unknown, sent_unknown = _forgot(client, monkeypatch, "nadie@example.com")
    assert known.status_code == unknown.status_code == 200
    assert known.json() == unknown.json()
    assert len(sent_known) == 1 and sent_unknown == []


def test_reset_flow_and_single_use(client, monkeypatch):
    client.post("/api/auth/register", json=CREDS)
    client.post("/api/auth/logout")
    _, sent = _forgot(client, monkeypatch, CREDS["email"])
    token = sent[0][1]
    new = {"token": token, "password": "nueva-clave-segura-2"}
    assert client.post("/api/auth/reset-password", json=new).status_code == 204
    # la vieja ya no sirve y la nueva sí
    old = client.post("/api/auth/login", json={"email": CREDS["email"], "password": CREDS["password"]})
    assert old.status_code == 401
    ok = client.post("/api/auth/login", json={"email": CREDS["email"], "password": new["password"]})
    assert ok.status_code == 200
    # el token no se puede reutilizar
    assert client.post("/api/auth/reset-password", json=new).status_code == 400


def test_reset_rejects_bad_token_and_weak_password(client, monkeypatch):
    client.post("/api/auth/register", json=CREDS)
    assert client.post("/api/auth/reset-password",
                       json={"token": "inventado", "password": "clave-valida-123"}).status_code == 400
    _, sent = _forgot(client, monkeypatch, CREDS["email"])
    weak = client.post("/api/auth/reset-password", json={"token": sent[0][1], "password": "corta"})
    assert weak.status_code == 422


def test_reset_token_expires(client, monkeypatch):
    from datetime import datetime, timedelta, timezone

    from app.models.password_reset import PasswordResetToken
    from app.db.session import get_db
    from app.main import app

    client.post("/api/auth/register", json=CREDS)
    _, sent = _forgot(client, monkeypatch, CREDS["email"])
    db = next(app.dependency_overrides[get_db]())
    db.query(PasswordResetToken).update({"expires_at": datetime.now(timezone.utc) - timedelta(minutes=1)})
    db.commit()
    r = client.post("/api/auth/reset-password", json={"token": sent[0][1], "password": "clave-valida-123"})
    assert r.status_code == 400


def test_forgot_is_rate_limited(client, monkeypatch):
    for _ in range(5):
        _forgot(client, monkeypatch, "x@example.com")
    r, _ = _forgot(client, monkeypatch, "x@example.com")
    assert r.status_code == 429
