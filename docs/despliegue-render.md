# Despliegue gratuito: Render + Neon

Un solo servicio web en Render (`render.yaml`): el backend sirve también la web compilada, así que
web y API comparten origen y la cookie de sesión funciona sin CORS. Los datos viven en Postgres de
Neon, fuera de Render, porque el disco del plan gratuito se borra al reiniciar.

## Pasos
1. **Base de datos.** En [neon.tech](https://neon.tech) crea un proyecto y copia la cadena de conexión
   (`postgresql://usuario:clave@host/db?sslmode=require`). No la compartas ni la subas al repositorio.
2. **Render.** New > Blueprint, elige el repositorio `MealToUs`.
3. Rellena lo que pide: `DATABASE_URL` (la de Neon), `OPENAI_API_KEY` (la de Groq) y, si quieres
   correo, los `SMTP_*`.
4. Cuando termine, copia la URL (por ejemplo `https://mealtous.onrender.com`) y ponla en `APP_BASE_URL`.
   Los enlaces de recuperar contraseña la usan.
5. Abre la URL y crea tu cuenta. Después puedes poner `ALLOW_REGISTRATION=false` para cerrar el alta.

## Límites del plan gratuito
- El servicio se duerme tras 15 minutos sin visitas; la primera carga tarda cerca de un minuto.
- Las tablas se crean solas al arrancar la primera vez.
- Comprueba con un menú semanal real que Render no corta la petición mientras la IA responde.
- Neon y Render pueden cambiar sus límites: revisa sus páginas de precios.
