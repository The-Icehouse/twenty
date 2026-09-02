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

## Fork features (Tier 1 of the HubSpot parity map)

Every feature is a fork-owned component under `packages/twenty-front/src/icehouse/<feature>/`, mounted into
upstream with one import line and one JSX line (nine upstream files, ~30 lines in total). Conventions the
slices settled on:

- Import fork code as `~/icehouse/...`; never add fork files inside upstream module directories.
- Upstream components carry only `data-icehouse="…"` hooks; fork components put their own hooks on their
  own elements (`data-icehouse`, `data-icehouse-tab`, `data-icehouse-part`) so `icehouse.css` never targets
  hashed class names.
- `icehouse.css` is append-only per feature section. When two branches both append, the merge is a union
  (base first, new section last); keep sections labelled with a comment header.
- `mise x node@24.16.0 -- node scripts/check-css.mjs` after any edit to `icehouse.css` (a lost brace breaks the whole bundle, and the CI build only tells you 8 minutes later).
- Typecheck (`mise x node@24.16.0 -- npx nx run twenty-front:typecheck`) and oxlint with the `twenty/*` plugin
  (`npx nx build twenty-oxlint-rules` once, then `npx oxlint -c packages/twenty-front/.oxlintrc.json <paths>`)
  before every commit. Vite does not typecheck.
- Mounting into a unit-tested upstream component needs a `jest.mock('~/icehouse/…', () => null)` in that test
  (see `PageLayoutLeftPanel.test.tsx`). If this spreads, switch to one `moduleNameMapper` entry.
- Desktop-first: every slice decides explicitly for side panel (`isInSidePanel`) and mobile (`useIsMobile`).

| Feature | Dir | Mount |
|---|---|---|
| View tab strip (+ view options) | `icehouse/view-tabs` | `RecordIndexViewBar.tsx` |
| Index toolbar (search, Filter badge, Sort, board toggle, columns) | `icehouse/toolbar` | `views/components/ViewBar.tsx` |
| Record quick-action row | `icehouse/quick-actions` | `page-layout/components/PageLayoutLeftPanel.tsx` |
| Table footer + bulk-action bar | `icehouse/footer` | `record-index/components/RecordIndexTableContainer.tsx` |
| Nav footer light/dark toggle | `icehouse/nav` | `navigation/components/MainNavigationDrawer.tsx` |
| Stage tracker (chevron pipeline + time in stage; Tier 2) | `icehouse/stage-tracker` | `record-show/components/PageLayoutRecordPageRenderer.tsx` |
| Name → page / arrow → preview | (upstream hook arg) | `useOpenRecordFromIndexView.ts`, `RecordTableWithWrappers.tsx` |
| Global top bar (Find or Ask, +, settings, help) — Tier 2 | `icehouse/top-bar` | `ui/layout/page/components/DefaultLayout.tsx` |
| Quick-filter chip row (Tier 2; field set in `quickFilterFields.ts`) | `icehouse/quick-filters` | `views/components/ViewBar.tsx` |
| Activities sub-tabs + search (Tier 2) | `icehouse/activities` | `activities/timeline-activities/components/TimelineCard.tsx` |
| Association cards column (Tier 2) | `icehouse/associations` | `record-show/components/PageLayoutRecordPageRenderer.tsx` (wraps `PageLayoutRenderer`) |
| Table render-perf: view switch keeps rows mounted and stops top-of-table re-renders cascading into every cell (perf tier) | `icehouse/perf` (`useLatestCallback`) | `useMemo`/`memo` in `RecordTableComponentInstance.tsx`, `RecordComponentInstanceContextsWrapper.tsx`, `RecordIndexContainerGater.tsx`, `useRecordIndexFieldMetadataDerivedStates.ts`, `useHandleIndexIdentifierClick.ts`, `RecordTableContextProvider.tsx`, `RecordTableNoRecordGroupBodyContextProvider.tsx`, `RecordTableBodyNoRecordGroupDragDropContextProvider.tsx`, `RecordTableRowVirtualizedContainer.tsx`; one `store.set` moved below the fetch in `useTriggerInitialRecordTableDataLoad.ts`. Measured −24 % of main-thread long tasks per saved-view switch (dev rig, `icehouse-crm/docs/2026-09-02-twenty-performance.md`) |
| Mobile tab bar + slim mobile header (mobile tier) | `icehouse/mobile` | `ui/layout/page/components/DefaultLayout.tsx` (replaces the `MobileNavigationBar` line); `data-icehouse` hook on `ui/layout/page/components/PageCardHeader.tsx` |
| Phone record page: header card, quick actions, compact tracker, About · Activities · Related (Mobile tier) | `icehouse/mobile` | `record-show/components/PageLayoutRecordPageRenderer.tsx` (wraps the `IcehouseRecordColumns` wrap; hides upstream's tab list with CSS and drives `activeTabIdComponentState`) |
| Phone record header: back · object label · previous/next record · "⋮", upstream's record header row folded in (Mobile tier) | `icehouse/mobile` (`IcehouseMobileRecordHeaderActions`, rendered by `IcehouseMobileHeader`) | no new mount — `DefaultLayout.tsx` already mounts the header; upstream's `PageCardHeader` row is hidden on phone record pages by CSS (`data-icehouse-page="record"` + `:has([data-icehouse="mobile-record"])` on the page container, so the row stays as the only title wherever the fork's mobile record page stands down: layout-customization mode, dashboards, no page layout yet); the header renders no record actions on dashboards (`CoreObjectNameSingular.Dashboard`, mirroring `PageLayoutRecordPageRenderer`'s layoutType rule) or in layout-customization mode, and fences them in an `AppErrorBoundary` with a null fallback, keyed by record so a throw is retried on the next one |
| Phone record page "More" segment: the layout's other tabs (Tasks, Notes, Files, Emails, Calendar, custom) in an upstream Dropdown picker (Mobile tier) | `icehouse/mobile` (`IcehouseMobileRecordMorePicker`, rendered by `IcehouseMobileRecordSegmentedControl`) | none new — same `PageLayoutRecordPageRenderer.tsx` wrap; a picked tab goes through the same `activeTabIdComponentState` |

## What lives where

- `packages/twenty-ui/src/data-display/Avatar/internal/avatarImageStatusStore.ts` — one image probe per URL, shared across mounts; failed `twenty-icons.com` logos remembered in localStorage (30 days). Rows are recycled by the virtualiser, so anything keyed on mount alone never worked.

- `theme/hubspot.json` + `scripts/apply-theme.mjs` — the colour/typography layer (mirrors `packages/twenty-ui/dist`).
- `packages/twenty-front/src/icehouse.css` — every fork style rule, scoped to stable hooks (`data-icehouse`, `data-testid`, ids).
- Upstream components carry only one-line `data-icehouse="…"` hooks. Never target Emotion's hashed class names.
- `scripts/local-preview.sh` — run any built image locally before it touches the VM.
- `.github/workflows/sync-upstream-and-build.yml` — weekly rebase + build + smoke test + push + Release. **Never deploys.**
- Typecheck before committing front-end changes: `mise x node@24.16.0 -- npx nx run twenty-front:typecheck` (~46 s).

Docs: `icehouse-crm/docs/TWENTY-THEME-FORK.md`, `icehouse-crm/docs/2026-09-02-hubspot-mechanics-parity-map.md`.

## Rebase notes (files that will conflict on the weekly sync)

- `packages/twenty-front/src/modules/object-record/record-index/components/RecordIndexContainerGater.tsx` — the
  perf memoisation wraps its three context values in `useMemo`; upstream main (after v2.37.4) has already rewritten
  this file (`useSetAtomComponentState`, JSX hoisted into an `indexContent` const). Resolution: take upstream's
  structure, then re-apply the three `useMemo`s around the values it passes to `RecordIndexContext`,
  `RecordComponentInstanceContextsWrapper` and the field-metadata derived states. The other nine perf files had no
  upstream changes at the time of writing. Toby's rule (2026-09-03): fixes stay on this branch, no upstream PRs.
