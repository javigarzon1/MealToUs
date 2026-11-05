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
