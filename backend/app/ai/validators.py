"""Validación determinista de seguridad alimentaria (red de seguridad sobre el LLM)."""
import unicodedata

from app.schemas.menu import DishOptions, WeeklyPlan
from app.schemas.preferences import UserPreferences
from app.schemas.shopping import ShoppingResult

# Amplía esta tabla: familia -> ingredientes típicos (sin tildes)
ALLERGEN_FAMILIES: dict[str, list[str]] = {
    "lacteos": ["leche", "queso", "yogur", "nata", "mantequilla", "requeson"],
    "frutos secos": ["nuez", "almendra", "avellana", "anacardo", "pistacho", "cacahuete"],
    "gluten": ["trigo", "pan", "pasta", "harina", "cebada", "centeno", "cuscus", "espelta", "kamut", "bulgur"],
    "marisco": ["gamba", "langostino", "cigala", "langosta", "camarón"], 
    "crustaceos": ["mejillon", "almeja", "cangrejo"],              
    "pescado" :["anchoa", "bacalao", "anguila", "platija", "mero", "merluza", "fletán", "caballa", "rape", "perca", "lucio", "sardina", "solla", "abadejo", "salmón", "sardina", "lubina", "dorada", "pargo", "pez espada", "trucha", "atún", "rodaballo", "pescado blanco", "pescadilla", "tilapia"],
    "huevos": ["huevo", "clara", "yema"],
    "soja": ["soja", "tofu", "tempeh", "salsa de soja"],
    "legumbres": ["lenteja", "garbanzo", "judía", "frijol", "guisante", "alubia"],
    "sésamo": ["sésamo", "ajonjolí", "tahini"],
    "mostaza": ["mostaza", "semilla de mostaza"],
    "apio": ["apio", "raíz de apio"],
    "sulfitos": ["sulfito", "dióxido de azufre", "metabisulfito", "sulfitos"],
    "altramuces": ["altramuz", "lupino"],
    "moluscos": ["caracol", "ostra", "vieira", "calamar", "pulpo", "sepia"],
    }


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower().strip())
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def _banned_terms(prefs: UserPreferences) -> set[str]:
    terms: set[str] = set()
    for raw in prefs.allergies + prefs.intolerances + prefs.dislikes:
        n = normalize(raw)
        terms.add(n)
        for family, members in ALLERGEN_FAMILIES.items():
            if n == family or n in members:
                terms.update(members)
                terms.add(family)
    return {t for t in terms if t}


def extract_ingredient_names(result) -> list[str]:
    if isinstance(result, DishOptions):
        return [i.name for d in result.options for i in d.ingredients]
    if isinstance(result, WeeklyPlan):
        return [i.name for day in result.days for d in (day.lunch, day.dinner) for i in d.ingredients]
    if isinstance(result, ShoppingResult):
        names = [i.name for i in result.shopping_list]
        names += [i.name for r in result.recipes for i in r.ingredients]
        return names
    return []


def find_conflicts(names: list[str], prefs: UserPreferences) -> list[str]:
    banned = _banned_terms(prefs)
    conflicts = []
    for name in names:
        n = normalize(name)
        hit = next((b for b in banned if b in n), None)
        if hit:
            conflicts.append(f"'{name}' choca con la restricción '{hit}'")
    return sorted(set(conflicts))
