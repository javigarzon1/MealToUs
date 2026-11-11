"""Capa de abstracción del LLM. El resto de la app solo conoce `LLMClient`."""
from abc import ABC, abstractmethod
from typing import Optional

from app.ai.budget import fit_output, request_budget
from app.core.config import settings


def capped(max_tokens: int, cap: Optional[int] = None) -> int:
    """Aplica el tope de tokens de respuesta (por defecto LLM_MAX_TOKENS; 0 = sin tope)."""
    limit = settings.llm_max_tokens if cap is None else cap
    return min(max_tokens, limit) if limit > 0 else max_tokens


def _tag(exc: Exception, label: str) -> Exception:
    """Añade al mensaje del proveedor qué modelo y host fallaron (sin claves), conservando el tipo."""
    base = getattr(exc, "message", None) or str(exc)
    try:
        exc.message = f"[{label}] {base}"
    except Exception:
        pass
    return exc


class ResponseTruncated(ValueError):
    """El modelo agotó los tokens de salida y la respuesta quedó a medias (JSON incompleto)."""


class LLMClient(ABC):
    @abstractmethod
    def complete(self, system: str, messages: list[dict], max_tokens: int = 2000) -> str:
        """messages: [{"role": "user"|"assistant", "content": "..."}]"""


class AnthropicClient(LLMClient):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None,
                 cap: Optional[int] = None) -> None:
        from anthropic import Anthropic

        self._client = Anthropic(api_key=api_key if api_key is not None else settings.anthropic_api_key)
        self._model = model or settings.llm_model
        self._cap = cap

    def complete(self, system: str, messages: list[dict], max_tokens: int = 2000) -> str:
        try:
            resp = self._client.messages.create(
                model=self._model,
                max_tokens=capped(max_tokens, self._cap),
                system=system,
                messages=messages,
            )
        except Exception as exc:
            raise _tag(exc, f"modelo {self._model} en anthropic") from None
        if getattr(resp, "stop_reason", None) == "max_tokens":
            raise ResponseTruncated("la respuesta se cortó al agotar los tokens de salida")
        return "".join(b.text for b in resp.content if b.type == "text")


class OpenAIClient(LLMClient):
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None,
                 model: Optional[str] = None, cap: Optional[int] = None) -> None:
        from openai import OpenAI

        self._client = OpenAI(
            api_key=api_key if api_key is not None else settings.openai_api_key,
            base_url=(base_url if base_url is not None else settings.llm_base_url) or None,
        )
        self._model = model or settings.llm_model
        self._cap = cap
        url = (base_url if base_url is not None else settings.llm_base_url) or "api.openai.com"
        self._host = url.split("//")[-1].split("/")[0]
        self._budget = request_budget(url, settings.llm_tpm_budget)
        # gpt-oss «razona» antes de responder y esos tokens cuentan en el límite de salida:
        # con esfuerzo bajo deja espacio para el JSON y responde antes
        self._reasoning = "low" if "gpt-oss" in self._model.lower() else None

    def complete(self, system: str, messages: list[dict], max_tokens: int = 2000) -> str:
        full = [{"role": "system", "content": system}, *messages]
        limit = fit_output(capped(max_tokens, self._cap), self._budget,
                           system, *[m["content"] for m in messages])
        label = f"modelo {self._model} en {self._host}"
        try:
            return self._complete(full, limit)
        except Exception as exc:
            raise _tag(exc, label) from None

    def _complete(self, full: list[dict], limit: int) -> str:
        from openai import BadRequestError

        kwargs: dict = {"model": self._model, "messages": full}
        if self._reasoning:
            kwargs["reasoning_effort"] = self._reasoning
        # Los modelos nuevos de OpenAI y Groq piden max_completion_tokens; algunos proveedores
        # compatibles solo conocen max_tokens, o no admiten reasoning_effort: se prueba sin ello.
        token_param = "max_completion_tokens"
        resp = None
        for _ in range(3):
            try:
                resp = self._client.chat.completions.create(**kwargs, **{token_param: limit})
                break
            except BadRequestError as exc:
                text = str(exc)
                if "reasoning_effort" in kwargs and "reasoning_effort" in text:
                    del kwargs["reasoning_effort"]
                elif token_param == "max_completion_tokens" and "max_completion_tokens" in text:
                    token_param = "max_tokens"
                else:
                    raise
        if resp is None:
            raise RuntimeError("El proveedor rechazó los parámetros de la petición")
        choice = resp.choices[0]
        if getattr(choice, "finish_reason", None) == "length":
            raise ResponseTruncated("la respuesta se cortó al agotar los tokens de salida")
        return choice.message.content or ""


def get_llm_client() -> LLMClient:
    if settings.llm_provider == "openai":
        return OpenAIClient()
    return AnthropicClient()


def get_shopping_llm_client() -> Optional[LLMClient]:
    """Cliente del segundo proveedor (lista de la compra), o None si no está configurado."""
    provider = settings.shopping_llm_provider
    if not provider:
        return None
    if not settings.shopping_llm_model:
        raise ValueError("Falta SHOPPING_LLM_MODEL para el segundo proveedor de la compra.")
    if provider == "openai":
        return OpenAIClient(api_key=settings.shopping_llm_api_key,
                            base_url=settings.shopping_llm_base_url,
                            model=settings.shopping_llm_model, cap=settings.shopping_llm_max_tokens)
    if provider == "anthropic":
        return AnthropicClient(api_key=settings.shopping_llm_api_key,
                               model=settings.shopping_llm_model, cap=settings.shopping_llm_max_tokens)
    raise ValueError(f"SHOPPING_LLM_PROVIDER desconocido: {provider}")
