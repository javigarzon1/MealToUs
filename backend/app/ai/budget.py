"""Presupuesto de tokens por petición, para planes gratuitos con límite por minuto (Groq: 8000 TPM).

Groq cuenta lo que se PIDE (entrada + max_completion_tokens), no solo lo generado, y rechaza con
un 413 la petición que supera el límite.
"""
GROQ_BUDGET = 7500  # margen bajo el límite de 8000 de Groq


def request_budget(base_url: str, override: int = 0) -> int:
    """Tokens máximos por petición (entrada + salida); 0 = sin límite conocido."""
    if override > 0:
        return override
    return GROQ_BUDGET if "groq.com" in (base_url or "") else 0


def estimate_tokens(*texts: str) -> int:
    """Estimación prudente: el español y el JSON rinden ~3 caracteres por token."""
    return sum(len(t) for t in texts) // 3 + 50


def fit_output(limit: int, budget: int, *texts: str, floor: int = 1200) -> int:
    """Reduce los tokens de salida pedidos para que entrada + salida quepan en el presupuesto."""
    if budget <= 0:
        return limit
    return max(floor, min(limit, budget - estimate_tokens(*texts)))
