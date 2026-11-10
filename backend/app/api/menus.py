import logging
import re

from fastapi import APIRouter, Depends, HTTPException # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session

from app.ai.agent import AgentError, MealAgent
from app.api.deps import get_agent, get_current_user
from app.api.history import record_menu
from app.db.session import get_db
from app.models.user import UserModel
from app.schemas.menu import DishOptions, WeeklyPlan
from app.schemas.requests import (ChatRequest, DinnerRequest, PlanContext,
                                  ShoppingRequest, WeeklyPlanRequest)
from app.schemas.shopping import ShoppingResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/menus", tags=["menus"])


_SECRET_RE = re.compile(r"(sk-[A-Za-z0-9_\-]{8,}|[A-Za-z0-9_\-]{32,})")


def _provider_message(exc: Exception) -> str:
    """Motivo que da el proveedor del LLM, recortado y sin nada parecido a una clave."""
    msg = getattr(exc, "message", None) or str(exc)
    return _SECRET_RE.sub("***", " ".join(str(msg).split()))[:300]


def _guard(fn, *args):
    """Convierte los fallos del agente/LLM en un 502 con un mensaje útil."""
    try:
        return fn(*args)
    except AgentError as exc:
        raise HTTPException(502, str(exc))
    except Exception as exc:  # clave inválida, sin red, cuota agotada...
        logger.exception("Error llamando al LLM")
        raise HTTPException(
            502,
            f"Error al llamar al LLM ({type(exc).__name__}): {_provider_message(exc)} "
            "Revisa la API key, el modelo y el proveedor en backend/.env.",
        )


@router.post("/lunch-options", response_model=DishOptions)
def lunch_options(req: PlanContext, agent: MealAgent = Depends(get_agent)):
    return _guard(agent.propose_lunch_options, req)


@router.post("/dinner-options", response_model=DishOptions)
def dinner_options(req: DinnerRequest, agent: MealAgent = Depends(get_agent)):
    return _guard(agent.propose_dinner_options, req, req.chosen_lunch)


@router.post("/weekly-plan", response_model=WeeklyPlan)
def weekly_plan(req: WeeklyPlanRequest, agent: MealAgent = Depends(get_agent),
                db: Session = Depends(get_db), user: UserModel = Depends(get_current_user)):
    plan = _guard(agent.build_weekly_plan, req, req.chosen_lunch, req.chosen_dinner, req.start_day)
    record_menu(db, user.id, plan)  # queda en el historial del usuario
    return plan


@router.post("/shopping", response_model=ShoppingResult)
def shopping(req: ShoppingRequest, agent: MealAgent = Depends(get_agent)):
    return _guard(agent.build_shopping_and_recipes, req, req.plan)


@router.post("/chat")
def chat(req: ChatRequest, agent: MealAgent = Depends(get_agent)):
    msgs = [m.model_dump() for m in req.messages]
    return {"reply": _guard(agent.chat, msgs, req.context, req.today)}
