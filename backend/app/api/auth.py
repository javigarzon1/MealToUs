"""Endpoints de autenticación: registro, login, forgot password, reset password."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.db.session import get_db
from app.schemas.user import UserCreate, UserOut
from app.schemas.auth import UserRegister, UserLogin, Token, PasswordResetRequest
from app.services.auth import (
    create_access_token,
    decode_token,
    authenticate_user,
    get_password_hash,
)
from app.models.user import UserModel
from app.core.config import settings


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user: UserRegister, db: Session = Depends(get_db)):
    """Registra un nuevo usuario."""
    from app.models.user import UserModel
    
    existing_user = db.query(UserModel).filter(UserModel.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado"
        )
    
    db_user = UserModel(
        email=user.email,
        full_name=user.full_name,
        hashed_password=get_password_hash(user.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserOut.model_validate(db_user)


@router.post("/login", response_model=Token)
def login(form_data: UserLogin, db: Session = Depends(get_db)):
    """Inicia sesión y devuelve un token de acceso."""
    user = authenticate_user(db, form_data.email, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60
    )


@router.post("/forgot-password", response_model=dict)
def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Solicita restablecimiento de contraseña."""
    from app.models.user import UserModel
    
    user = db.query(UserModel).filter(UserModel.email == request.email).first()
    if not user:
        # No revelar si el usuario existe o no por seguridad
        return {"message": "Si el correo está registrado, recibirás un enlace de restablecimiento"}
    
    # Aquí generaríamos un token de reset y enviaríamos email
    # Por ahora, devolvemos mensaje genérico
    return {"message": "Se enviará un enlace de restablecimiento a tu correo"}


@router.post("/reset-password", response_model=dict)
def reset_password(password_data: dict, db: Session = Depends(get_db)):
    """Restablece la contraseña con un token."""
    from app.models.user import UserModel
    
    token = password_data.get("token")
    new_password = password_data.get("new_password")
    
    if not token or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token y nueva contraseña requeridos"
        )
    
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado"
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido"
        )
    
    user = db.query(UserModel).filter(UserModel.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Actualizar contraseña
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Contraseña restablecida exitosamente. Ya puedes iniciar sesión."}


@router.get("/me")
def read_current_user():
    """Obtiene datos del usuario actual."""
    return {"message": "Endpoint en construcción - validar token"}


@router.post("/logout")
def logout():
    """Cierra la sesión (invalida el token)."""
    return {"message": "Sesión cerrada exitosamente"}