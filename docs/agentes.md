# Equipo de agentes

Director del proyecto: **tú**. Los agentes viven en `.agents/` y reportan a ti.

| Agente | Territorio | Cuándo usarlo |
| --- | --- | --- |
| `db-endpoints` | `models/`, `schemas/`, `api/`, `db/`, tests de API | "Crea la tabla de recetas y sus endpoints" |
| `backend-python` | `ai/`, `services/`, `integrations/`, `core/`, tests, dependencias | "Mejora el agente de IA", "organiza el paquete" |

## Cómo invocarlos

Pídelo de forma explícita, indicando el archivo del agente:

- "Lee `.agents/db-endpoints.md` y actúa como ese agente para crear la tabla `recipes`."
- "Lee `.agents/backend-python.md` y actúa como ese agente para mejorar el validador de alergias."

## Flujo de trabajo recomendado

1. Tú das la tarea con objetivo y criterio de aceptación.
2. El agente la ejecuta dentro de su territorio y devuelve un **informe** (formato fijo).
3. Tú revisas, apruebas o corriges; los commits los decides tú.
4. Si una tarea cruza territorios, primero `backend-python` crea el servicio y después `db-endpoints` lo expone.
