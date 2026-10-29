from functools import lru_cache

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.ai.agent import MealAgent
from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import UserModel


@lru_cache
def get_agent() -> MealAgent:
    return MealAgent()


def get_current_user(request: Request, db: Session = Depends(get_db)) -> UserModel:
    """Usuario de la sesión (cookie httpOnly). 401 si no hay sesión válida."""
    token = request.cookies.get(settings.cookie_name)
    user_id = decode_access_token(token) if token else None
    user = db.get(UserModel, user_id) if user_id is not None else None
    if user is None or not user.is_active:
        raise HTTPException(401, "No has iniciado sesión.")
    return user
