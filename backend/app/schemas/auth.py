"""Schemas para el sistema de autenticación."""
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class UserRegister(BaseModel):
    """Schema para registro de nuevo usuario."""
    email: EmailStr = Field(..., description="Correo electrónico")
    full_name: Optional[str] = Field(None, description="Nombre completo (opcional)")
    password: str = Field(..., min_length=6, max_length=128, description="Contraseña")


class UserLogin(BaseModel):
    """Schema para login."""
    email: EmailStr = Field(..., description="Correo electrónico")
    password: str = Field(..., description="Contraseña")


class Token(BaseModel):
    """Schema para token de acceso."""
    access_token: str = Field(..., description="Token JWT de acceso")
    token_type: str = Field(default="bearer", description="Tipo de token")
    expires_in: int = Field(..., description="Tiempo de expiración en segundos")


class PasswordResetRequest(BaseModel):
    """Schema para solicitud de restablecimiento de contraseña."""
    email: EmailStr = Field(..., description="Correo electrónico")


class PasswordReset(BaseModel):
    """Schema para restablecer contraseña."""
    token: str = Field(..., description="Token de restablecimiento")
    new_password: str = Field(..., min_length=6, description="Nueva contraseña")


class UserOut(BaseModel):
    """Schema de salida de usuario."""
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    is_superuser: bool

    model_config = {"from_attributes": True}