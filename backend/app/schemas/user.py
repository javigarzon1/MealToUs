from typing import Optional
from pydantic import BaseModel, Field, EmailStr
from pydantic.config import ConfigDict


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico único")
    full_name: Optional[str] = Field(None, description="Nombre completo")
    is_active: bool = Field(True, description="Usuario activo")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Contraseña (mínimo 6 caracteres)")


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = Field(None, description="Correo electrónico")
    full_name: Optional[str] = Field(None, description="Nombre completo")
    is_active: Optional[bool] = Field(None, description="Estado activo")


class UserInDB(UserBase):
    id: int
    hashed_password: str
    is_active: bool
    is_superuser: bool

    model_config = ConfigDict(from_attributes=True)


class UserOut(UserBase):
    id: int
    is_active: bool
    is_superuser: bool

    model_config = ConfigDict(from_attributes=True)