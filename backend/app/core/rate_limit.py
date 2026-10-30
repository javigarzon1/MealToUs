"""Límite sencillo de intentos de login fallidos (en memoria, por proceso)."""
import time

from fastapi import HTTPException


class LoginLimiter:
    def __init__(self, max_attempts: int = 5, window_seconds: int = 900) -> None:
        self.max_attempts = max_attempts
        self.window = window_seconds
        self._fails: dict[str, list[float]] = {}

    def _recent(self, key: str) -> list[float]:
        cutoff = time.monotonic() - self.window
        recent = [t for t in self._fails.get(key, []) if t > cutoff]
        if recent:
            self._fails[key] = recent
        else:
            self._fails.pop(key, None)
        return recent

    def check(self, key: str) -> None:
        if len(self._recent(key)) >= self.max_attempts:
            raise HTTPException(429, "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.")

    def fail(self, key: str) -> None:
        self._fails.setdefault(key, []).append(time.monotonic())

    def clear(self, key: str) -> None:
        self._fails.pop(key, None)

    def reset(self) -> None:
        self._fails.clear()


login_limiter = LoginLimiter()
