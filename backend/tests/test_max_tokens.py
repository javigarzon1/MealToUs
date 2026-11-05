from app.ai.llm_client import capped
from app.core.config import settings


def test_capped_applies_limit_only_when_set(monkeypatch):
    monkeypatch.setattr(settings, "llm_max_tokens", 0)
    assert capped(8000) == 8000
    monkeypatch.setattr(settings, "llm_max_tokens", 5000)
    assert capped(8000) == 5000
    assert capped(1500) == 1500
