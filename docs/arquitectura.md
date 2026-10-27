# Arquitectura

```text
React (Vite) --HTTP/JSON--> FastAPI --> MealAgent --> LLMClient (Anthropic / OpenAI)
                               |
                               +--> SQLite/PostgreSQL (despensa)
                               +--> integrations/supermarkets (enlaces/carrito)
```

Capas del backend: `api` (rutas) → `ai` (agente) → `schemas` (contratos Pydantic).

El LLM se aísla tras `LLMClient`, así puedes cambiar de proveedor o usar un
`FakeLLM` en tests sin tocar el resto.
