from fastapi import APIRouter, Depends, HTTPException

from app.ai.agent import AgentError, MealAgent
from app.api.deps import get_agent
from app.schemas.menu import DishOptions, WeeklyPlan
from app.schemas.requests import (ChatRequest, DinnerRequest, PlanContext,
                                  ShoppingRequest, WeeklyPlanRequest)
from app.schemas.shopping import ShoppingResult

router = APIRouter(prefix="/menus", tags=["menus"])


def _guard(fn, *args):
    try:
        return fn(*args)
    except AgentError as exc:
        raise HTTPException(502, str(exc))


@router.post("/lunch-options", response_model=DishOptions)
def lunch_options(req: PlanContext, agent: MealAgent = Depends(get_agent)):
    return _guard(agent.propose_lunch_options, req)


@router.post("/dinner-options", response_model=DishOptions)
def dinner_options(req: DinnerRequest, agent: MealAgent = Depends(get_agent)):
    return _guard(agent.propose_dinner_options, req, req.chosen_lunch)


@router.post("/weekly-plan", response_model=WeeklyPlan)
def weekly_plan(req: WeeklyPlanRequest, agent: MealAgent = Depends(get_agent)):
    return _guard(agent.build_weekly_plan, req, req.chosen_lunch, req.chosen_dinner)


@router.post("/shopping", response_model=ShoppingResult)
def shopping(req: ShoppingRequest, agent: MealAgent = Depends(get_agent)):
    return _guard(agent.build_shopping_and_recipes, req, req.plan)


@router.post("/chat")
def chat(req: ChatRequest, agent: MealAgent = Depends(get_agent)):
    msgs = [m.model_dump() for m in req.messages]
    return {"reply": agent.chat(msgs, req.context)}
