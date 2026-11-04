# Despliegue en Render

Dos servicios definidos en `render.yaml`:

| Servicio | Tipo | Qué hace |
|---|---|---|
| `mealtous` | Web (nginx) | Sirve la web y reenvía `/api` al backend. Es la única URL pública. |
| `mealtous-api` | Privado | FastAPI con la base SQLite en un disco persistente (`/data`). |

La web y la API comparten origen, así que la cookie de sesión funciona sin CORS.

## Pasos
1. En Render: **New > Blueprint** y elige el repositorio `MealToUs`.
2. Rellena los valores que pide (marcados `sync: false`): `OPENAI_API_KEY` (la de Groq) y, si quieres correo, los `SMTP_*`.
3. Cuando termine, copia la URL de `mealtous` (por ejemplo `https://mealtous.onrender.com`) y pégala en `APP_BASE_URL` del servicio `mealtous-api`. Los enlaces de recuperar contraseña usan esa URL.
4. Abre la URL y crea tu cuenta.

## Costes y límites
- El servicio privado y el disco requieren un plan de pago (starter, unos pocos dólares al mes). Sin disco, SQLite se borraría en cada despliegue.
- La web en plan `free` se duerme tras 15 minutos sin visitas y tarda en despertar.
- El proxy espera hasta 120 s a la IA. Comprueba con un menú semanal real que Render no corta antes la conexión.
- Si quieres cerrar el alta tras crear tu cuenta, pon `ALLOW_REGISTRATION=false`.
