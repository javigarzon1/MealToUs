MealToUs

Es una aplicación que optimiza los alimentos que tienes en tu nevera y despensa, planificando tres menús posibles: la primera opción sería Healthy, la segunda Normal y la tercera para Deportista.

Partiendo de lo anterior se procede a elaborar una tabla con un menú semanal para las personas que marquemos.

La segunda parte de la aplicación nos dará varias opciones útiles como número de personas que comerán, alergias o intolerancias (también podemos añadir alimentos que no nos gustan) y, lo más importante, para el diseño del menú semanal nos creará una lista de la compra y las recetas para poder elaborar ese menú.

Con la lista de la compra tendremos la opción de enviarla a los principales supermercados (Mercadona, Hipercor, Carrefour...) para hacer la compra online y facilitar la elaboración de los platos que nos marca la aplicación.

Flujo de uso

Indicas qué tienes en la nevera/despensa y tus preferencias (personas, alergias, intolerancias, "no me gusta").
La IA propone 3 opciones de comida (Healthy / Normal / Deportista) y eliges una.
La IA propone 3 opciones de cena y eliges una.
Genera el menú de 7 días (una comida y una cena por día) siguiendo las kcal de lo elegido.
Genera la lista de la compra (solo lo que falta) y las recetas.
(Opcional) Enlaces a supermercados online.

Más detalle en docs/flujo-ia.md.

Tecnologías

Backend: Python 3.11+, FastAPI, Pydantic, SQLAlchemy (SQLite en desarrollo)
IA: LLM por API (Anthropic por defecto, OpenAI opcional) tras una capa de abstracción LLMClient
Frontend: React + TypeScript + Vite
Tests: pytest (con un LLM falso, sin gastar tokens)

Estructura

MealToUs/
├── README.md
├── AGENTE.md               # contexto y reglas del equipo de agentes
├── .agents/                # db-endpoints y backend-python
├── .env.example            # claves y configuración (copiar a .env)
├── docs/                   # arquitectura, flujo de la IA y equipo de agentes
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py         # arranque FastAPI
│   │   ├── core/           # configuración
│   │   ├── db/             # conexión a base de datos
│   │   ├── models/         # tablas SQLAlchemy
│   │   ├── schemas/        # contratos Pydantic (menús, compra, peticiones)
│   │   ├── api/            # endpoints: pantry, menus, shopping
│   │   ├── ai/             # agente: llm_client, prompts, agent, validators
│   │   ├── integrations/
│   │   │   └── supermarkets/   # Mercadona, Carrefour, Hipercor
│   │   └── services/       # lógica de negocio sin LLM
│   └── tests/
└── frontend/
    └── src/
        ├── api/            # cliente HTTP
        ├── types/          # tipos TypeScript
        ├── pages/          # Pantry, Preferences, LunchOptions, DinnerOptions,
        │                   # WeeklyPlan, ShoppingList, Chat
        └── components/

Puesta en marcha

cp .env.example .env            # añade tu ANTHROPIC_API_KEY

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload   # http://localhost:8000/docs

# Tests
pytest

# Frontend (otra terminal)
cd frontend
npm install
npm run dev                     # http://localhost:5173

Aviso

Las calorías y recomendaciones son estimaciones generadas por IA y no sustituyen el consejo de un dietista o médico. Revisa siempre las alergias en las etiquetas de los productos.