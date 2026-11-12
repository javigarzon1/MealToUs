"""Reconocimiento de alimentos en una foto de la nevera o la despensa."""
import logging
from typing import Literal, Optional

from pydantic import BaseModel

from app.ai.agent import extract_json
from app.ai.llm_client import LLMClient

log = logging.getLogger(__name__)

UNITS = ("ud", "g", "kg", "ml", "l", "paquete")
MAX_ITEMS = 40

_UNIT_ALIASES = {
    "ud": "ud", "uds": "ud", "u": "ud", "unidad": "ud", "unidades": "ud", "pieza": "ud", "piezas": "ud",
    "bote": "ud", "botes": "ud", "lata": "ud", "latas": "ud", "botella": "ud", "botellas": "ud",
    "g": "g", "gr": "g", "gramo": "g", "gramos": "g",
    "kg": "kg", "kilo": "kg", "kilos": "kg", "kilogramo": "kg", "kilogramos": "kg",
    "ml": "ml", "mililitro": "ml", "mililitros": "ml",
    "l": "l", "lt": "l", "litro": "l", "litros": "l",
    "paquete": "paquete", "paquetes": "paquete", "paq": "paquete", "pack": "paquete", "packs": "paquete",
    "bolsa": "paquete", "bolsas": "paquete", "caja": "paquete", "cajas": "paquete", "bandeja": "paquete",
}

SYSTEM = (
    "Eres un asistente de cocina que mira fotos de una nevera o despensa. Respondes siempre en español "
    "y solo con JSON válido y minificado, sin texto extra."
)

PROMPT = (
    "Mira la foto e identifica los alimentos y bebidas que se ven con claridad. "
    'Devuelve {"quality":"ok|blurry|dark|too_far|not_food","advice":"…","items":[{"name":"…",'
    '"quantity":número o null,"unit":"ud|g|kg|ml|l|paquete" o null,"confidence":"alta|media|baja"}]}. '
    "quality: ok si la foto se puede leer; blurry si está borrosa o movida; dark si está oscura; "
    "too_far si hay que acercarse; not_food si no se ven alimentos. "
    "En advice, una frase corta con qué hacer para mejorar la foto (vacío si quality es ok). "
    "name: nombre genérico en singular y minúsculas (p. ej. «leche», «tomate»), sin marcas. "
    "Cuenta lo que se distingue; si no puedes estimar la cantidad o la unidad, pon null. "
    "No inventes lo que esté tapado o no se vea. Una entrada por alimento."
)

_ADVICE = {
    "blurry": "La foto está borrosa. Sujeta bien el móvil y repítela.",
    "dark": "La foto está demasiado oscura. Enciende la luz o abre bien la puerta y repítela.",
    "too_far": "Hay que acercarse más: repite la foto desde más cerca, una balda cada vez.",
    "not_food": "No he visto alimentos en la foto. Apunta a la nevera o la despensa y repítela.",
}
_UNREADABLE = "No he podido leer la foto. Repítela con buena luz y de frente."
_NO_ITEMS = "No he reconocido ningún alimento. Repite la foto con más luz y más cerca."


class ScanItem(BaseModel):
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    confidence: Literal["alta", "media", "baja"] = "media"
    needs_confirmation: bool = False


class ScanResult(BaseModel):
    status: Literal["ok", "retake"]
    message: Optional[str] = None
    items: list[ScanItem] = []


def normalize_unit(raw: object) -> Optional[str]:
    if not isinstance(raw, str):
        return None
    return _UNIT_ALIASES.get(raw.strip().lower().rstrip("."))


def _quantity(raw: object) -> Optional[float]:
    try:
        value = float(raw)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    return round(value, 2) if 0 < value < 100000 else None


def build_result(data: dict) -> ScanResult:
    """Valida lo que dijo el modelo y marca qué hay que confirmar o repetir la foto."""
    quality = str(data.get("quality") or "ok").lower()
    if quality in _ADVICE:
        advice = str(data.get("advice") or "").strip()
        return ScanResult(status="retake", message=advice or _ADVICE[quality])

    items: list[ScanItem] = []
    seen: set[str] = set()
    raw_items = data.get("items")
    for raw in raw_items if isinstance(raw_items, list) else []:
        if not isinstance(raw, dict):
            continue
        name = " ".join(str(raw.get("name") or "").split())[:60]
        key = name.lower()
        if not name or key in seen:
            continue
        seen.add(key)
        qty, unit = _quantity(raw.get("quantity")), normalize_unit(raw.get("unit"))
        conf = str(raw.get("confidence") or "media").lower()
        conf = conf if conf in ("alta", "media", "baja") else "media"
        items.append(ScanItem(name=name, quantity=qty, unit=unit, confidence=conf,  # type: ignore[arg-type]
                              needs_confirmation=qty is None or unit is None or conf != "alta"))
        if len(items) >= MAX_ITEMS:
            break
    if not items:
        return ScanResult(status="retake", message=_NO_ITEMS)
    return ScanResult(status="ok", items=items)


def scan_image(client: LLMClient, image_b64: str, mime: str) -> ScanResult:
    """Pide al modelo de visión la lista; reintenta una vez si la respuesta no es JSON."""
    for _ in range(2):
        raw = client.describe_image(SYSTEM, PROMPT, image_b64, mime, max_tokens=1500)
        try:
            return build_result(extract_json(raw))
        except ValueError:
            log.warning("Respuesta de visión no válida: %.200s", raw)
    return ScanResult(status="retake", message=_UNREADABLE)
