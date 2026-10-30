# Autenticación

Cuentas con email y contraseña. La sesión vive en una cookie `httpOnly`
(`mealtous_session`) que el navegador envía solo a la propia web; JavaScript no puede leerla.

## Endpoints

| Método | Ruta | Qué hace |
| --- | --- | --- |
| POST | `/api/auth/register` | Crea la cuenta e inicia sesión |
| POST | `/api/auth/login` | Inicia sesión |
| POST | `/api/auth/logout` | Cierra la sesión |
| GET | `/api/auth/me` | Devuelve el usuario de la sesión (401 si no hay) |

`/api/pantry`, `/api/menus/*` y `/api/shopping/*` exigen sesión: sin cuenta nadie puede gastar tu API key del LLM.

## Configuración (`backend/.env`)

| Variable | Para qué |
| --- | --- |
| `SECRET_KEY` | Firma las sesiones. Si falta, se usa una temporal y las sesiones se pierden al reiniciar |
| `TOKEN_DAYS` | Duración de la sesión (7 por defecto) |
| `COOKIE_SECURE` | `true` si sirves la web con tu propio HTTPS |
| `ALLOW_REGISTRATION` | `false` para cerrar el alta de nuevos usuarios |

## Seguridad

- Contraseñas con `scrypt` y sal aleatoria; nunca se guardan ni se devuelven en claro.
- Mensaje de error idéntico para email desconocido y contraseña errónea.
- Máximo 5 intentos fallidos de login por IP y email cada 15 minutos (en memoria: se reinicia con el servidor).
- Cerrar sesión borra la cookie, pero un token ya emitido sigue siendo válido hasta que caduque.
  Para invalidarlos todos, cambia `SECRET_KEY`.
- Los datos de despensa y menús siguen en el navegador de cada usuario (una clave por cuenta).
  La tabla `pantry_items` del backend es compartida y no está asociada a usuarios.
