"""Contraseñas (scrypt, librería estándar) y tokens de sesión (JWT firmado)."""
import base64
import hashlib
import hmac
import secrets
import time

import jwt

from app.core.config import settings

# scrypt: ~32 MiB por hash. Parámetros guardados junto al hash para poder subirlos.
_N, _R, _P = 2**15, 8, 1
_MAXMEM = 64 * 1024 * 1024
_ALGORITHM = "HS256"


def _b64(raw: bytes) -> str:
    return base64.b64encode(raw).decode("ascii")


def _unb64(text: str) -> bytes:
    return base64.b64decode(text.encode("ascii"))


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"), salt=salt, n=_N, r=_R, p=_P, maxmem=_MAXMEM, dklen=32
    )
    return f"scrypt${_N}${_R}${_P}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, n, r, p, salt, digest = stored.split("$")
        if scheme != "scrypt":
            return False
        expected = _unb64(digest)
        calc = hashlib.scrypt(
            password.encode("utf-8"), salt=_unb64(salt),
            n=int(n), r=int(r), p=int(p), maxmem=_MAXMEM, dklen=len(expected),
        )
        return hmac.compare_digest(calc, expected)
    except (ValueError, TypeError):
        return False


_dummy: str | None = None


def dummy_hash() -> str:
    """Hash falso para gastar el mismo tiempo cuando el email no existe."""
    global _dummy
    if _dummy is None:
        _dummy = hash_password(secrets.token_urlsafe(16))
    return _dummy


def create_access_token(user_id: int) -> str:
    now = int(time.time())
    payload = {"sub": str(user_id), "iat": now, "exp": now + settings.token_days * 86400}
    return jwt.encode(payload, settings.secret_key, algorithm=_ALGORITHM)


def decode_access_token(token: str) -> int | None:
    """Devuelve el id de usuario, o None si el token es inválido o ha caducado."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[_ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError, TypeError):
        return None
