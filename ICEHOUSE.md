# twenty-fork — Icehouse agent conventions

This is The Icehouse's fork of Twenty (branch `icehouse` on top of the upstream release tag in `BASE_TAG`).
Programme rules live in `~/Projects/icehouse-crm/AGENTS.md` — read them first. Upstream's own guidance is in
`CLAUDE.md` (kept verbatim so rebases stay clean).

## Coordination — one driver at a time

Several agents (Claude Code, Codex) have access to this repo AND to the production VM. On 2026-09-02 a
deploy and a commit went unrecorded when the operator's connection dropped mid-turn; the same session then
re-deployed the same image 90 seconds later believing another agent had acted. Nothing broke, but with two
different images that is a production collision, so the rules stand:

- **Before deploying**: `ssh -i ~/.ssh/icehouse-crm-eval -o IdentitiesOnly=yes claude@192.168.1.17 '~/bin/agent-lock status'`.
  `scripts/deploy-to-vm.sh` takes the lock itself; if it is held, stop and ask Toby.
- **Announce in git**: commit messages say what you changed and, if you deployed, which digest. `git log` is how
  the other agent finds out. Pull before you start; push when you are done.
- **Check `git log` for a newer commit before deploying a build** — the other agent may have moved `icehouse`
  since your build was cut.
- **Codex**: scoped code changes and CI fixes are yours. Deploying to the VM is not; leave `deploy-to-vm.sh` to
  Claude Code unless Toby says otherwise (capability table in icehouse-crm/AGENTS.md).

## What lives where

- `theme/hubspot.json` + `scripts/apply-theme.mjs` — the colour/typography layer (mirrors `packages/twenty-ui/dist`).
- `packages/twenty-front/src/icehouse.css` — every fork style rule, scoped to stable hooks (`data-icehouse`, `data-testid`, ids).
- Upstream components carry only one-line `data-icehouse="…"` hooks. Never target Emotion's hashed class names.
- `scripts/local-preview.sh` — run any built image locally before it touches the VM.
- `.github/workflows/sync-upstream-and-build.yml` — weekly rebase + build + smoke test + push + Release. **Never deploys.**
- Typecheck before committing front-end changes: `mise x node@24.16.0 -- npx nx run twenty-front:typecheck` (~46 s).

Docs: `icehouse-crm/docs/TWENTY-THEME-FORK.md`, `icehouse-crm/docs/2026-09-02-hubspot-mechanics-parity-map.md`.
