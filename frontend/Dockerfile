# --- Compilación ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npx vite build

# --- Servidor: nginx sirve la web y reenvía /api al backend ---
FROM nginx:1.27-alpine
# nginx sustituye ${PORT} y ${BACKEND_HOST} al arrancar (plantilla)
ENV PORT=80 BACKEND_HOST=backend:8000
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
