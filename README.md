# MealToUs

Es una aplicación que optimiza los alimentos que tienes en tu nevera y despensa, planificando tres  menus posibles: La primera opción sería Healthy, la segunda normal y la tercera para deportista.

Partiendo de lo anterior se procede a elaborar una tabla con un menu semanal para las personas que marquemos.

La segunda parte de la aplicación, es que nos dará varias opciones útiles como número de personas que comerán,  alergias o intolerancias (también podríamos añadir alimentos que no nos gustan) y lo más importante, para el diseño del menú semanal, nos creará una lista de la compra y las recetas para poder elaborar ese menú.

Estos menus, también nos creará una lista de la compra y nos dará la opción de enviarla a los principales supermercados Mercadona, Hipercor, Carrefour,,,, para hacer la compra online y nos facilite la elaboración de los platos que nos marca la aplicación.

Tecnologias:

Frontend: React, Vue,js
Backend: Python/FastAPI
Base de Datos: SQL

Estructura:
MealToUs/
 README.md                 ← actualizado: flujo, tecnologías,  estructura, arranque
  .env.example
 docs/                     (arquitectura.md, flujo-ia.md)
 backend/
          ├── app/
          ├── main.py
          ├── core/             configuración
          ├── db/ models/       despensa en BD
          ├── schemas/          contratos de menús, compra y peticiones
          ├── api/              pantry, menus, shopping
          ├── ai/               llm_client, prompts, agent, 


          validators
                    ├── supermarkets/   Mercadona, Carrefour, Hipercor
│   │   └── services/
│   └── tests/
└── frontend/src
                 ├── api/
                 ├── types/
                 ├── pages/
                 ├── components/