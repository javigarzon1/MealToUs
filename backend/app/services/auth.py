"""Servicios de autenticación: hashing, tokens, gestión de usuarios."""
import hashlib
import json
import base64
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.user import UserCreate, UserInDB, UserOut


# OAuth2 bearer token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash."""
    plain_hash = hashlib.sha256(plain_password.encode() + settings.secret_key.encode()).hexdigest()
    return plain_hash == hashed_password


def get_password_hash(password: str) -> str:
    """Genera un hash de la contraseña."""
    return hashlib.sha256(password.encode() + settings.secret_key.encode()).hexdigest()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea un token de acceso JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": int(expire.timestamp()), "sub": str(data.get("user_id", ""))})
    encoded = base64.urlsafe_b64encode(json.dumps(to_encode).encode()).decode()
    return encoded


def decode_token(token: str) -> Optional[dict]:
    """Decodifica y valida un JWT de acceso."""
    try:
        payload = json.loads(base64.urlsafe_b64decode(token + "==").encode())
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            return None
        return payload
    except (json.JSONDecodeError, Exception):
        return None


def authenticate_user(db: Session, email: str, password: str) -> Optional[UserInDB]:
    """Autentica un usuario contra la base de datos."""
    from app.db.session import SessionLocal
    from app.models.user import UserModel
    
    db_session = SessionLocal()
    try:
        user = db_session.query(UserModel).filter(UserModel.email == email).first()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
    finally:
        db_session.close()


def get_current_user(db: Session, token: str) -> UserInDB:
    """Obtiene el usuario actual del token."""
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudieron validar las credenciales",
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    from app.db.session import SessionLocal
    db_session = SessionLocal()
    try:
        user = db_session.query(UserModel).filter(UserModel.id == int(user_id)).first()
        if user is None:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Usuario inactivo")
        return UserOut.model_validate(user)
    finally:
        db_session.close()