from functools import lru_cache

from app.ai.agent import MealAgent


@lru_cache
def get_agent() -> MealAgent:
    return MealAgent()
