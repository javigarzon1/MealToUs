from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.rate_limit import login_limiter
from app.core.security import (create_access_token, dummy_hash, hash_password,
                               verify_password)
from app.db.session import get_db
from app.models.user import UserModel
from app.schemas.auth import LoginRequest, RegisterRequest
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
