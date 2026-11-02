"""Capa de abstracción del LLM. El resto de la app solo conoce `LLMClient`."""
from abc import ABC, abstractmethod

from app.core.config import settings


class LLMClient(ABC):
    @abstractmethod
    def complete(self, system: str, messages: list[dict], max_tokens: int = 2000) -> str:
        """messages: [{"role": "user"|"assistant", "content": "..."}]"""


class AnthropicClient(LLMClient):
    def __init__(self) -> None:
        from anthropic import Anthropic

        self._client = Anthropic(api_key=settings.anthropic_api_key)

    def complete(self, system: str, messages: list[dict], max_tokens: int = 2000) -> str:
        resp = self._client.messages.create(
            model=settings.llm_model,
            max_tokens=max_tokens,
            system=system,
            messages=messages,
        )
        return "".join(b.text for b in resp.content if b.type == "text")


class OpenAIClient(LLMClient):
    def __init__(self) -> None:
        from openai import OpenAI

        self._client = OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.llm_base_url or None,
        )

    def complete(self, system: str, messages: list[dict], max_tokens: int = 2000) -> str:
        from openai import BadRequestError

        full = [{"role": "system", "content": system}, *messages]
        try:
            # Los modelos nuevos de OpenAI y Groq piden max_completion_tokens...
            resp = self._client.chat.completions.create(
                model=settings.llm_model, max_completion_tokens=max_tokens, messages=full
            )
        except BadRequestError as exc:
            if "max_completion_tokens" not in str(exc):
                raise
            # ...y algunos proveedores compatibles solo conocen max_tokens
            resp = self._client.chat.completions.create(
                model=settings.llm_model, max_tokens=max_tokens, messages=full
            )
        return resp.choices[0].message.content or ""


def get_llm_client() -> LLMClient:
    if settings.llm_provider == "openai":
        return OpenAIClient()
    return AnthropicClient()
