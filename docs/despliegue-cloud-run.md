# Despliegue en Google Cloud Run

Cloud Run ejecuta el mismo `Dockerfile` que Render (backend + web compilada en un solo contenedor).
Se apaga cuando no hay visitas y despierta en unos segundos, bastante antes que el plan gratuito de Render.
La base de datos sigue siendo Neon.

> Cloud Run pide tarjeta para activar la facturación, pero tiene una cuota gratuita mensual. Con
> `--max-instances 2` y `--min-instances 0` el gasto de un uso personal debería quedar en 0 €.
> Comprueba la cuota actual en la [página de precios](https://cloud.google.com/run/pricing).

## 1. Una sola vez

1. Crea un proyecto en <https://console.cloud.google.com> y activa la facturación (con un presupuesto
   y alerta de 1 € en *Facturación → Presupuestos y alertas*).
2. Abre **Cloud Shell** (icono `>_` arriba a la derecha) o instala `gcloud` en tu Codespace y ejecuta
   `gcloud auth login`.
3. Clona el repositorio en Cloud Shell: `git clone https://github.com/javigarzon1/MealToUs && cd MealToUs`.

## 2. Variables de entorno

```bash
cp cloudrun.env.example.yaml cloudrun.env.yaml
nano cloudrun.env.yaml   # rellena tus valores; las claves las pones tú, nunca en el chat ni en GitHub
```

`APP_BASE_URL` no se conoce hasta el primer despliegue: déjalo como está, despliega, copia la URL
que muestra y vuelve a desplegar con ese valor.

## 3. Desplegar

```bash
./deploy-cloudrun.sh MI_PROYECTO europe-west1
```

Al terminar escribe la URL (`https://mealtous-….run.app`). Ábrela y comprueba `/health`.
La región `europe-west1` (Bélgica) entra en la cuota gratuita; no cambies a otra sin comprobarlo.

## 4. Actualizar

Tras fusionar cambios en `main`: `git pull && ./deploy-cloudrun.sh MI_PROYECTO`.

## Notas

- Las peticiones a la IA pueden tardar hasta un minuto; `--timeout 300` lo permite.
- Si el correo de recuperación apunta a la URL antigua, actualiza `APP_BASE_URL`.
- Para volver a Render basta con no usar este archivo: el `Dockerfile` es el mismo.
