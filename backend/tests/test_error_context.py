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


def _fake_response(content="{}", finish="stop"):
    from types import SimpleNamespace

    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content),
                                                    finish_reason=finish)])


def test_truncated_openai_answer_raises_a_clear_error():
    from app.ai.llm_client import ResponseTruncated

    client = OpenAIClient(api_key="x", base_url="https://api.groq.com/openai/v1", model="m")
    client._client.chat.completions.create = lambda **kw: _fake_response('{"a": 1', finish="length")
    with pytest.raises(ResponseTruncated):
        client.complete("sys", [{"role": "user", "content": "hola"}])


def test_gpt_oss_uses_low_reasoning_effort():
    client = OpenAIClient(api_key="x", base_url="https://api.groq.com/openai/v1", model="openai/gpt-oss-120b")
    sent = {}
    client._client.chat.completions.create = lambda **kw: (sent.update(kw), _fake_response())[1]
    client.complete("sys", [{"role": "user", "content": "hola"}])
    assert sent["reasoning_effort"] == "low"


def test_other_models_do_not_get_reasoning_effort():
    client = OpenAIClient(api_key="x", base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                          model="gemini-3.5-flash-lite")
    sent = {}
    client._client.chat.completions.create = lambda **kw: (sent.update(kw), _fake_response())[1]
    client.complete("sys", [{"role": "user", "content": "hola"}])
    assert "reasoning_effort" not in sent


def test_provider_that_rejects_reasoning_effort_is_retried_without_it():
    import httpx
    from openai import BadRequestError

    client = OpenAIClient(api_key="x", base_url="https://api.groq.com/openai/v1", model="openai/gpt-oss-120b")
    calls = []

    def create(**kw):
        calls.append(dict(kw))
        if "reasoning_effort" in kw:
            resp = httpx.Response(400, request=httpx.Request("POST", "https://x/y"))
            raise BadRequestError("Unknown parameter: reasoning_effort", response=resp, body=None)
        return _fake_response("ok")

    client._client.chat.completions.create = create
    assert client.complete("sys", [{"role": "user", "content": "hola"}]) == "ok"
    assert len(calls) == 2 and "reasoning_effort" not in calls[1]


def test_falls_back_to_max_tokens_when_max_completion_tokens_is_unknown():
    import httpx
    from openai import BadRequestError

    client = OpenAIClient(api_key="x", base_url="https://otro.example/v1", model="m")
    calls = []

    def create(**kw):
        calls.append(dict(kw))
        if "max_completion_tokens" in kw:
            resp = httpx.Response(400, request=httpx.Request("POST", "https://x/y"))
            raise BadRequestError("Unsupported parameter: max_completion_tokens", response=resp, body=None)
        return _fake_response("ok")

    client._client.chat.completions.create = create
    assert client.complete("sys", [{"role": "user", "content": "hola"}], max_tokens=777) == "ok"
    assert calls[1]["max_tokens"] == 777
