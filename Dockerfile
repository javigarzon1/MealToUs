# Un solo contenedor para Render: el backend sirve también la web compilada.
FROM node:20-alpine AS web
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY frontend/ .
RUN npx vite build

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 STATIC_DIR=/app/static PORT=8000
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY --from=web /app/dist ./static
RUN useradd --create-home appuser
USER appuser
EXPOSE 8000
# --proxy-headers: detrás de Render, así el límite de intentos ve la IP real de cada visitante
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
