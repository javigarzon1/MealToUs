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
