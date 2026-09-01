#!/usr/bin/env bash
# Deploy a built fork image to the Twenty VM — deliberately, by digest, with rollback.
#
#   scripts/deploy-to-vm.sh sha256:<digest>        # from the workflow's job summary
#   scripts/deploy-to-vm.sh --rollback              # restore the previous digest
#
# Run from the desktop (it has the VM key). This is the ONLY path that changes what
# production runs; the build workflow never deploys. Keeps the digest-pin discipline:
# ~/stacks/twenty/.env always holds an exact @sha256, never a floating tag.
set -euo pipefail
VM="claude@192.168.1.17"
SSH=(ssh -i "$HOME/.ssh/icehouse-crm-eval" -o IdentitiesOnly=yes -o ConnectTimeout=10 "$VM")
IMAGE="ghcr.io/the-icehouse/twenty"
ENVF='~/stacks/twenty/.env'

if [ "${1:-}" = "--rollback" ]; then
  "${SSH[@]}" "test -f $ENVF.prev || { echo 'no previous .env to roll back to'; exit 1; }
    cp $ENVF $ENVF.rolledback && cp $ENVF.prev $ENVF && cd ~/stacks/twenty && docker compose up -d server worker
    echo 'rolled back to:'; grep ^TWENTY_IMAGE= $ENVF"
  exit 0
fi

DIGEST="${1:?usage: $0 sha256:<digest> | --rollback}"
[[ "$DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo "not a digest: $DIGEST" >&2; exit 1; }
REF="$IMAGE@$DIGEST"

echo "==> lock"
"${SSH[@]}" "~/bin/agent-lock take 'deploy-to-vm' 'swapping Twenty image to $DIGEST'" 
trap '"${SSH[@]}" "~/bin/agent-lock release" >/dev/null 2>&1 || true' EXIT

echo "==> pull $REF"
"${SSH[@]}" "docker pull -q '$REF'"

echo "==> swap digest (previous kept at .env.prev)"
"${SSH[@]}" "cp $ENVF $ENVF.prev && sed -i 's#^TWENTY_IMAGE=.*#TWENTY_IMAGE=$REF#' $ENVF && grep ^TWENTY_IMAGE= $ENVF"

echo "==> restart server + worker (db/redis untouched)"
"${SSH[@]}" "cd ~/stacks/twenty && docker compose up -d server worker"

echo "==> wait for /healthz (entrypoint runs 'command:prod upgrade' on boot — a no-op on the same upstream tag)"
for i in $(seq 1 40); do
  if "${SSH[@]}" "curl -sf -m 5 http://127.0.0.1:3000/healthz >/dev/null"; then
    echo "healthy after ~$((i*5))s"
    "${SSH[@]}" "docker exec twenty-server-1 sh -c 'echo APP_VERSION=\$APP_VERSION' 2>/dev/null || true"
    echo "==> done. Verify the UI at https://twenty.theicehouse.app then keep or: $0 --rollback"
    exit 0
  fi
  sleep 5
done
echo "!! never became healthy — rolling back automatically"
"${SSH[@]}" "cp $ENVF.prev $ENVF && cd ~/stacks/twenty && docker compose up -d server worker"
"${SSH[@]}" "docker logs twenty-server-1 --tail 40 2>&1 | tail -20"
exit 1
