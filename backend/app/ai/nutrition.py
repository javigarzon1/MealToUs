"""Rangos de calorías por tipo de dieta y comprobación de la información nutricional."""
from typing import Optional

from app.schemas.menu import DietType, Dish

# kcal por ración (mínimo, máximo) de la COMIDA según el tipo de dieta
RANGES: dict[str, tuple[int, int]] = {
    "healthy": (150, 400),   # ligera
    "sport": (500, 600),     # deportista
    "normal": (600, 700),    # normal
}
LABEL = {"healthy": "ligera", "normal": "normal", "sport": "deportista"}

# Reparto del tope diario: la comida puede llevar hasta el 60 % y la cena es siempre más ligera
LUNCH_SHARE = 0.6
MIN_DINNER = 100


def lunch_cap(max_kcal: Optional[int]) -> Optional[int]:
    return round(max_kcal * LUNCH_SHARE) if max_kcal else None


def lunch_bounds(diet: DietType, max_kcal: Optional[int] = None) -> tuple[int, int]:
    """Rango de kcal de la comida; el tope diario del usuario, si existe, lo recorta por arriba."""
    lo, hi = RANGES[diet.value]
    cap = lunch_cap(max_kcal)
    if cap:
        hi = min(hi, cap)
        lo = min(lo, hi)
    return lo, hi


def dinner_bounds(diet: DietType, lunch_kcal: int, max_kcal: Optional[int] = None) -> tuple[int, int]:
    """La cena respeta el máximo de su tipo, es más ligera que la comida y cabe en el tope diario."""
    hi = min(RANGES[diet.value][1], lunch_kcal - 1)
    if max_kcal:
        hi = min(hi, max_kcal - lunch_kcal)
    hi = max(hi, MIN_DINNER)
    return min(150, hi), hi


def kcal_problems(dish: Dish, lo: int, hi: int) -> list[str]:
    k = dish.kcal_per_serving
    if lo <= k <= hi:
        return []
    return [f"'{dish.name}' ({dish.diet_type.value}) tiene {k} kcal y debe estar entre {lo} y {hi}"]


def nutrition_problems(dish: Dish) -> list[str]:
    """Falta de datos o macros que no cuadran con las calorías (P·4 + H·4 + G·9)."""
    n = dish.nutrition
    if n is None:
        return [f"'{dish.name}' no incluye 'nutrition' (proteínas, grasas, hidratos y fibra)"]
    calc = 4 * n.protein_g + 4 * n.carbs_g + 9 * n.fat_g
    tolerance = max(60, 0.3 * dish.kcal_per_serving)
    if abs(calc - dish.kcal_per_serving) > tolerance:
        return [f"'{dish.name}': {dish.kcal_per_serving} kcal no cuadra con sus macros "
                f"(proteína×4 + hidratos×4 + grasa×9 = {round(calc)} kcal)"]
    return []
