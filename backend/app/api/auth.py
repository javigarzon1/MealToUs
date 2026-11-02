import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.email import send_password_reset
from app.core.rate_limit import login_limiter, reset_limiter
from app.core.security import (create_access_token, dummy_hash, hash_password,
                               verify_password)
from app.db.session import get_db
from app.models.password_reset import PasswordResetToken
from app.models.user import UserModel
from app.schemas.auth import (ForgotPasswordRequest, LoginRequest, RegisterRequest,
                              ResetPasswordRequest)
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _start_session(response: Response, user: UserModel) -> None:
    response.set_cookie(
        settings.cookie_name,
        create_access_token(user.id),
        max_age=settings.token_days * 86400,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path="/",
    )


@router.post("/register", response_model=UserOut, status_code=201)
def register(req: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    if not settings.allow_registration:
        raise HTTPException(403, "El registro está cerrado.")
    if db.query(UserModel).filter(UserModel.email == req.email).first():
        raise HTTPException(409, "Ya existe una cuenta con ese email.")
    user = UserModel(
        email=req.email,
        full_name=req.full_name,
        hashed_password=hash_password(req.password),
        is_active=True,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _start_session(response, user)
    return user


@router.post("/login", response_model=UserOut)
def login(req: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    key = f"{request.client.host if request.client else '?'}|{req.email}"
    login_limiter.check(key)
    user = db.query(UserModel).filter(UserModel.email == req.email).first()
    # Se verifica siempre un hash para que el tiempo no delate si el email existe
    ok = verify_password(req.password, user.hashed_password if user else dummy_hash())
    if not user or not ok or not user.is_active:
        login_limiter.fail(key)
        raise HTTPException(401, "Email o contraseña incorrectos.")
    login_limiter.clear(key)
    _start_session(response, user)
    return user


@router.post("/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(settings.cookie_name, path="/")


@router.get("/me", response_model=UserOut)
def me(user: UserModel = Depends(get_current_user)):
    return user


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, request: Request, background: BackgroundTasks,
                    db: Session = Depends(get_db)):
    """Responde siempre lo mismo, exista o no el email (no se revela qué cuentas hay)."""
    key = f"{request.client.host if request.client else '?'}|{req.email}"
    reset_limiter.check(key)
    reset_limiter.fail(key)  # cada petición cuenta, para frenar el abuso del envío de correos
    user = db.query(UserModel).filter(UserModel.email == req.email).first()
    if user and user.is_active:
        token = secrets.token_urlsafe(32)
        db.add(PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_token(token),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.reset_token_minutes),
        ))
        db.commit()
        background.add_task(send_password_reset, user.email, token)
    return {"message": "Si el email existe, te hemos enviado un enlace para restablecer la contraseña."}


@router.post("/reset-password", status_code=204)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    row = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == _hash_token(req.token)).first()
    now = datetime.now(timezone.utc)
    expires = row.expires_at.replace(tzinfo=timezone.utc) if row and row.expires_at.tzinfo is None \
        else (row.expires_at if row else None)
    if not row or row.used_at is not None or expires < now:
        raise HTTPException(400, "El enlace no es válido o ha caducado. Pide uno nuevo.")
    user = db.get(UserModel, row.user_id)
    if not user or not user.is_active:
        raise HTTPException(400, "El enlace no es válido o ha caducado. Pide uno nuevo.")
    user.hashed_password = hash_password(req.password)
    # Un token usado, y cualquier otro pendiente de ese usuario, dejan de valer
    for other in db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None)):
        other.used_at = now
    db.commit()
