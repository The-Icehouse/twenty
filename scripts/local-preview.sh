#!/usr/bin/env bash
# Run a built fork image locally with throwaway Postgres+Redis so UI changes are checked
# BEFORE they touch the production VM.
#   scripts/local-preview.sh up  [image]     # default ghcr.io/the-icehouse/twenty:latest → http://localhost:3001
#   scripts/local-preview.sh down            # destroys containers AND volumes
#   scripts/local-preview.sh logs
set -euo pipefail
cd "$(dirname "$0")/.."
export PREVIEW_IMAGE="${2:-ghcr.io/the-icehouse/twenty:latest}"
export PREVIEW_APP_SECRET="${PREVIEW_APP_SECRET:-$(head -c 32 /dev/urandom | base64 | tr -d '\n=+/')}"
COMPOSE=(docker compose -p twenty-preview -f scripts/local-preview.compose.yml)
case "${1:-up}" in
  up)
    echo "==> preview of $PREVIEW_IMAGE"
    docker pull -q "$PREVIEW_IMAGE" >/dev/null
    "${COMPOSE[@]}" up -d --remove-orphans
    for i in $(seq 1 90); do
      if curl -sf -m 3 http://localhost:3001/healthz >/dev/null 2>&1; then
        echo "==> healthy after ~$((i*3))s → http://localhost:3001  (fresh DB: sign up as preview@example.invalid with any password, then skip the onboarding steps)"; exit 0; fi
      sleep 3
    done
    echo "!! never became healthy; last server log lines:"; "${COMPOSE[@]}" logs --tail 40 server; exit 1 ;;
  down)  "${COMPOSE[@]}" down -v --remove-orphans; echo "==> preview destroyed (volumes included)" ;;
  logs)  "${COMPOSE[@]}" logs --tail 80 server worker ;;
  *) echo "usage: $0 up [image] | down | logs"; exit 2 ;;
esac
