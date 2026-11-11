import pytest

from app.ai.llm_client import OpenAIClient


class Boom(Exception):
    def __init__(self):
        super().__init__("Error code: 404")
        self.message = "Error code: 404"


def test_provider_error_names_model_and_host():
    client = OpenAIClient(api_key="x", base_url="https://api.groq.com/openai/v1", model="mi-modelo")

    def fail(**kwargs):
        raise Boom()

    client._client.chat.completions.create = fail
    with pytest.raises(Boom) as info:
        client.complete("sys", [{"role": "user", "content": "hola"}])
    assert "mi-modelo" in info.value.message and "api.groq.com" in info.value.message


def _asked_tokens(base_url: str, text: str, wanted: int = 5000) -> int:
    from types import SimpleNamespace

    client = OpenAIClient(api_key="x", base_url=base_url, model="m")
    asked = {}

    def fake(**kwargs):
        asked.update(kwargs)
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content="{}"))])

    client._client.chat.completions.create = fake
    client.complete("sistema", [{"role": "user", "content": text}], max_tokens=wanted)
    return asked["max_completion_tokens"]


def test_groq_request_is_trimmed_to_fit_the_per_minute_limit():
    big = "x" * 9000  # ~3000 tokens de entrada: con 5000 de salida serían > 8000
    asked = _asked_tokens("https://api.groq.com/openai/v1", big)
    assert asked < 5000 and asked + len(big) // 3 < 8000


def test_other_providers_keep_the_requested_output():
    assert _asked_tokens("https://generativelanguage.googleapis.com/v1beta/openai/", "x" * 9000) == 5000
