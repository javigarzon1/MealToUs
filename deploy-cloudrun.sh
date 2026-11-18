#!/usr/bin/env bash
# Despliega MealToUs en Google Cloud Run desde la raíz del repositorio (usa el Dockerfile).
# Uso: ./deploy-cloudrun.sh [proyecto] [región]
set -euo pipefail

PROJECT="${1:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${2:-europe-west1}"
SERVICE="mealtous"
ENV_FILE="cloudrun.env.yaml"

[ -n "$PROJECT" ] || { echo "Indica el proyecto: ./deploy-cloudrun.sh MI_PROYECTO"; exit 1; }
[ -f "$ENV_FILE" ] || { echo "Falta $ENV_FILE (copia cloudrun.env.example.yaml y rellénalo)"; exit 1; }

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  --project "$PROJECT"

# --timeout 300: la IA tarda hasta un minuto en responder.
# --max-instances 2: tope para que nunca se dispare el gasto. --min-instances 0: se apaga sin visitas (gratis).
gcloud run deploy "$SERVICE" \
  --project "$PROJECT" --region "$REGION" --source . \
  --allow-unauthenticated \
  --memory 512Mi --cpu 1 --concurrency 20 \
  --timeout 300 --min-instances 0 --max-instances 2 \
  --env-vars-file "$ENV_FILE"

echo "URL del servicio:"
gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format 'value(status.url)'
