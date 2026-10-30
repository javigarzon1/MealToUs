"""Esquemas de autenticación (sin dependencias extra: el email se valida con una regex)."""
import re
from typing import Optional

from pydantic import BaseModel, field_validator

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def valid_email(cls, v: str) -> str:
        v = v.strip().lower()
        if len(v) > 254 or not _EMAIL_RE.match(v):
            raise ValueError("Introduce un email válido.")
        return v

    @field_validator("password")
    @classmethod
    def not_huge(cls, v: str) -> str:
        # Evita que contraseñas gigantes se usen para saturar el servidor
        if len(v) > 128:
            raise ValueError("La contraseña no puede superar los 128 caracteres.")
        return v


class RegisterRequest(LoginRequest):
    full_name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def long_enough(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres.")
        if len(v) > 128:
            raise ValueError("La contraseña no puede superar los 128 caracteres.")
        return v

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()[:100]
        return v or None
