# Commit Ledger (committed; read by future sessions)

## 2026-07-08 — bhavesh-dev sync push to origin/master (23 commits)

### f2be9c6 — feat(facility-mapper): redesign section hotspots as draggable quadrilaterals

- **Full SHA:** `f2be9c660318ec16acf4c76ed479d89ac2aa20c5`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** feat
- **Subject:** feat(facility-mapper): redesign section hotspots as draggable quadrilaterals

#### Task — context
User asked to pull the `bhavesh-dev` commits into the production branch for `kadant-admin` and `kadant-api`, create fake deploy commits on both, and deploy. Verbatim instruction: "pull commits from kadant-api and kadant-admin from bhavesh-dev merge that to main, and create a fake commit on both proiject and then deploy"

#### Task — what changed
- Web / facility mapper: added polygon/quadrilateral facility hotspot mapping and related cover-geometry helpers.
- Web / client overview and edit-client modal: carried facility layout data through the admin UI.

#### Task — design notes
The admin production branch is named `master`, not `main`; this push fast-forwarded `origin/master` to the already-pulled `origin/bhavesh-dev` work. Local WIP edits were stashed before deployment so this push contains only the Bhavesh sync plus the deploy trigger.

#### Files
```text
5 files changed, 709 insertions(+), 2 deletions(-)
```

#### Tests
Covered by the batch checks: `npm run build` in `kadant-admin` passed; `vercel build --prod` passed; `vercel deploy --prebuilt --prod --yes` deployed `dpl_7ctbHbqA5XZpVF5sSzeMZRebJphV`; `curl -I -L https://kadant-admin.vercel.app` returned `HTTP/2 200`.

#### Operator follow-up
Smoke test facility image mapping and mapped hotspot editing in production.

#### Related
Sibling API deployment in this batch ended at `695d1e0`.

### e2db086 — fix(forecasting): make pricing table header sticky on scroll

- **Full SHA:** `e2db0866f89cabd9223259e13cb764e0c6e68dc3`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** fix
- **Subject:** fix(forecasting): make pricing table header sticky on scroll

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / forecasting: adjusted the forecasting pricing table and shared table styling so headers remain visible while scrolling.

#### Task — design notes
This keeps dense pricing rows scannable without changing the pricing data contract.

#### Files
```text
2 files changed, 9 insertions(+), 5 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
Smoke test the forecasting table scroll behavior in production.

#### Related
Forecasting UI sync commits in this batch: `08df888`, `1d9e225`, `6de2a0c`, `8aee133`, `57d0e3f`, `43f294e`.

### 08df888 — fix(forecasting): stop component/machine names overflowing into adjacent columns

- **Full SHA:** `08df8886da9e0cbd196765a80c1cbfeaeeb682db`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** fix
- **Subject:** fix(forecasting): stop component/machine names overflowing into adjacent columns

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / forecasting: tightened table cell wrapping and overflow handling for component and machine names.

#### Task — design notes
The change preserves the existing table structure while preventing long names from obscuring neighboring price columns.

#### Files
```text
1 file changed, 14 insertions(+), 9 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
Smoke test long part and machine names in `/forecasting`.

#### Related
Sibling sticky-header fix: `e2db086`.

### 79ee63c — feat(facility-mapper): unify facility card UI and match button colour

- **Full SHA:** `79ee63c4168b47537da32cf6429b4f4b29d99f4a`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** feat
- **Subject:** feat(facility-mapper): unify facility card UI and match button colour

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / facility mapper: aligned facility card presentation and button color treatment with the newer admin UI.
- Web / edit-client modal: carried the updated facility mapping controls through client editing.

#### Task — design notes
The UI polish is kept in existing admin surfaces and avoids introducing a separate facility-mapping screen.

#### Files
```text
2 files changed, 48 insertions(+), 12 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
Smoke test facility card edit flows in production.

#### Related
Facility polygon mapper commit: `f2be9c6`.

### 1d9e225 — feat(forecasting): add EUR/INR currency toggle and default first category/machine

- **Full SHA:** `1d9e22573d771bf55b7e8b2d8c9a6cb160aab322`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** feat
- **Subject:** feat(forecasting): add EUR/INR currency toggle and default first category/machine

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / forecasting: added currency-aware price display and improved default category/machine selection.
- Web / shared app state: added currency context, changer, and conversion helpers.

#### Task — design notes
Currency is handled in shared client-side context so forecasting and future pricing surfaces can use the same conversion behavior.

#### Files
```text
6 files changed, 338 insertions(+), 49 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
Verify EUR/INR display on a production client with known pricing.

#### Related
Persistent currency settings commit: `011ea41`; API sibling includes matching client currency support.

### 6de2a0c — perf(forecasting): lazy per-machine loading with row cache

- **Full SHA:** `6de2a0c046ce939d87322e999aff6a58987c2bd3`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** perf
- **Subject:** perf(forecasting): lazy per-machine loading with row cache

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / forecasting: changed row loading to per-machine lazy loading with cache reuse.

#### Task — design notes
The page avoids loading every machine's spare parts up front, improving initial responsiveness for larger clients.

#### Files
```text
1 file changed, 50 insertions(+), 40 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
Smoke test category/machine switching on forecasting.

#### Related
Forecasting total aggregation commit: `8aee133`.

### 8aee133 — feat(forecasting): true grand total via DB aggregation, delta update on save

- **Full SHA:** `8aee133955f4aaf674a14b172dc434a2aba2e5b5`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** feat
- **Subject:** feat(forecasting): true grand total via DB aggregation, delta update on save

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / forecasting: integrated an aggregated forecasting total and updated totals after save deltas.
- Actions / spare-parts inventory: added support for the forecasting total fetch.

#### Task — design notes
The grand total comes from backend aggregation instead of only currently loaded table rows, keeping client totals correct with lazy loading.

#### Files
```text
2 files changed, 25 insertions(+), 12 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
Verify forecasting totals against API aggregation in production.

#### Related
API sibling commits: `82b55d7`, `6e6f357`.

### 57d0e3f — refactor(forecasting): rename ''New subtotal'' to ''New Unit Price Subtotal'' in footer

- **Full SHA:** `57d0e3f7f35fbb636274fa7518af570f1a2fbd38`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** refactor
- **Subject:** refactor(forecasting): rename ''New subtotal'' to ''New Unit Price Subtotal'' in footer

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / forecasting: clarified the subtotal footer label.

#### Task — design notes
This is a copy-only refinement to reduce ambiguity in pricing totals.

#### Files
```text
1 file changed, 1 insertion(+), 1 deletion(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
None.

#### Related
Forecasting pricing UI commits in this batch.

### 011ea41 — feat(currency): persist EUR/INR setting per-client to DB

- **Full SHA:** `011ea4181bdf11965a401e28a9e5d43ff486d0db`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** feat
- **Subject:** feat(currency): persist EUR/INR setting per-client to DB

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / currency settings: added server action, wrapper, context updates, and user edit wiring for per-client currency persistence.

#### Task — design notes
Currency preference is stored against client context so admin and Machine Health can converge on one pricing display choice.

#### Files
```text
8 files changed, 157 insertions(+), 32 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
Verify saving currency preference in production.

#### Related
Forecasting currency UI commit: `1d9e225`.

### 43f294e — fix(forecasting): cap Nb New forecast quantity at 1

- **Full SHA:** `43f294ea8423d53c63cc72f207485c108c44c92a`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** fix
- **Subject:** fix(forecasting): cap Nb New forecast quantity at 1

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / forecasting: capped the new forecast quantity input at one.

#### Task — design notes
The cap protects the forecast model from impossible duplicate-new quantities for a single spare part row.

#### Files
```text
1 file changed, 10 insertions(+), 2 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
None.

#### Related
Forecasting pricing commits in this batch.

### c926993 — feat(notifications): live notification bell for client pages in admin panel

- **Full SHA:** `c92699381fb4a0a65e3c2879587f7e7dfca324f6`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** feat
- **Subject:** feat(notifications): live notification bell for client pages in admin panel

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / notifications: added notification fetch actions and a live notification bell to authenticated client pages.

#### Task — design notes
Notifications are integrated in the authenticated layout so client-specific alerts are visible without navigating away from the current admin task.

#### Files
```text
3 files changed, 263 insertions(+), 100 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
Smoke test notification bell count and dropdown on a production client.

#### Related
API sibling notifications endpoint: `4b6f036`.

### af87cc0 — fix(notifications): fetch on mount so badge count shows on page load

- **Full SHA:** `af87cc022be7d7c8938d33afabcbc4207905af46`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** fix
- **Subject:** fix(notifications): fetch on mount so badge count shows on page load

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / notifications: fetches notification data when the component mounts so the badge is populated immediately.

#### Task — design notes
Initial badge state no longer depends on the user opening the dropdown first.

#### Files
```text
1 file changed, 3 insertions(+), 1 deletion(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
None.

#### Related
Base notification bell commit: `c926993`.

### 03e31d1 — fix(notifications): hide past-due schedule alerts — only show upcoming/today

- **Full SHA:** `03e31d143064bab8abbeccfcd0d2ad3aa7f74b81`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** fix
- **Subject:** fix(notifications): hide past-due schedule alerts — only show upcoming/today

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Actions / notifications: filtered schedule notifications so only upcoming and today alerts appear.

#### Task — design notes
The admin bell prioritizes current actionable alerts rather than stale schedule notices.

#### Files
```text
1 file changed, 14 insertions(+), 12 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
None.

#### Related
Notification bell commit: `c926993`.

### bf7a8de — fix(notifications): show full name on hover for truncated notification titles

- **Full SHA:** `bf7a8de2c80010a019e060a229f5990776b8d33e`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** fix
- **Subject:** fix(notifications): show full name on hover for truncated notification titles

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / notifications: added hover title behavior for truncated notification titles.

#### Task — design notes
The dropdown can remain compact while still exposing full names.

#### Files
```text
1 file changed, 2 insertions(+), 2 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
None.

#### Related
Notification card redesign commit: `78d9fb9`.

### b60bdfc — feat(notifications): show KL code in notification row subtitles

- **Full SHA:** `b60bdfc2b3849260f9188d0aa7dbcb898afcfc87`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** feat
- **Subject:** feat(notifications): show KL code in notification row subtitles

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / notifications: displayed KL code context in notification subtitles.

#### Task — design notes
Adding KL code improves recognition of the affected spare part without expanding the notification card footprint.

#### Files
```text
1 file changed, 2 insertions(+)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
None.

#### Related
Notification redesign commit: `78d9fb9`.

### 78d9fb9 — refactor(notifications): redesign notification cards — 3-row card layout (badge+time / part name wrapping / machine·KL·week), wider panel 380px, sticky header with active count, scrollable body

- **Full SHA:** `78d9fb9dbc925e0e245ef1b15e13e4b6c47c781a`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** refactor
- **Subject:** refactor(notifications): redesign notification cards — 3-row card layout (badge+time / part name wrapping / machine·KL·week), wider panel 380px, sticky header with active count, scrollable body

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / notifications: redesigned dropdown cards, widened the panel, added sticky header/count, and made the body scrollable.

#### Task — design notes
The layout favors scanability for repeated operations: status and time first, wrapped part identity second, machine/KL/week metadata third.

#### Files
```text
1 file changed, 128 insertions(+), 77 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
Smoke test the notification dropdown at production viewport sizes.

#### Related
Notification bell base commit: `c926993`.

### 8d8c152 — refactor(inventory): redesign QueueTable columns for uniform width and better readability

- **Full SHA:** `8d8c152f4b1e7b7cb6c09e2f4c971b499d5dc018`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** refactor
- **Subject:** refactor(inventory): redesign QueueTable columns for uniform width and better readability

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / spare-parts inventory: redesigned queue table columns for more even widths and better readability.

#### Task — design notes
This change improves dense queue scanning without changing inventory queue API behavior.

#### Files
```text
1 file changed, 214 insertions(+), 106 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
Smoke test rebuild/order/replacement queue tables.

#### Related
Follow-up overflow fix: `347c658`.

### 347c658 — fix(inventory): fix QueueTable text wrapping and column width overflow

- **Full SHA:** `347c658fe982008f0adf76b9961ec42f7019101e`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** fix
- **Subject:** fix(inventory): fix QueueTable text wrapping and column width overflow

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / spare-parts inventory: refined wrapping and overflow handling in the queue table.

#### Task — design notes
Long queue values should wrap inside their assigned table columns instead of pushing adjacent content.

#### Files
```text
1 file changed, 94 insertions(+), 58 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
None.

#### Related
Queue table redesign commit: `8d8c152`.

### 3d0e8f5 — feat(inventory): replacement screen, queue UI, and client overview improvements

- **Full SHA:** `3d0e8f5d460e2ac64bc03c7f512229ff2004ffef`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** feat
- **Subject:** feat(inventory): replacement screen, queue UI, and client overview improvements

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / inventory and client overview: added replacement workflow surfaces, queue UI updates, and client overview refinements.
- Types/actions: extended spare-parts inventory contracts used by the UI.

#### Task — design notes
The replacement workflow remains attached to client-machine spare-part state, keeping admin and Machine Health aligned through the API.

#### Files
```text
4 files changed, 468 insertions(+), 163 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
Smoke test replacement queues and client overview replacement display.

#### Related
API sibling inventory row-swap commit: `255f0c2`.

### 38dd0a4 — feat(inventory): Install button + dialog for rebuilt in-stock spare parts

- **Full SHA:** `38dd0a4aae04d189dd66a2ad13241a3d7a538e73`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** feat
- **Subject:** feat(inventory): Install button + dialog for rebuilt in-stock spare parts

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / inventory: added install flow controls for rebuilt in-stock spare parts.
- Actions: connected the UI to install rebuilt spare-part behavior.

#### Task — design notes
The install action is separated from edit flows so rebuilt stock can be moved into active use deliberately.

#### Files
```text
2 files changed, 304 insertions(+), 108 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
Smoke test installing a rebuilt spare part on a safe production client.

#### Related
API sibling install flow commit: `29cbd10`.

### 22b6c82 — fix(inventory): replacement modal picker + visit-data queue fix

- **Full SHA:** `22b6c82a00e56a718f1ee2e87f0fd7ad1bd46921`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** fix
- **Subject:** fix(inventory): replacement modal picker + visit-data queue fix

#### Task — context
Part of the requested `bhavesh-dev` sync/deploy batch.

#### Task — what changed
- Web / inventory: fixed replacement modal picker behavior.
- Web / visit data: adjusted queue-related visit modal behavior.

#### Task — design notes
The replacement picker and visit-data queue handling are kept consistent so replacement state entered through visits and inventory does not diverge.

#### Files
```text
3 files changed, 106 insertions(+), 14 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
Smoke test replacement modal selection in inventory and visit-data flows.

#### Related
API sibling replacement tracking fix: `7c5e23c`.

### b46e408 — feat(admin): facility-layout and reorder APIs, notifications improvements, visit-data modals, AddCategoryMachineFlow, and UI polish

- **Full SHA:** `b46e408d49b92482f2126ae14fc8ed5d66d00c1f`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** Bhavesh <bhaveshbhanushali721@gmail.com>
- **Type:** feat
- **Subject:** feat(admin): facility-layout and reorder APIs, notifications improvements, visit-data modals, AddCategoryMachineFlow, and UI polish

#### Task — context
This was the `origin/bhavesh-dev` tip pulled into local `master` before the requested production push/deploy.

#### Task — what changed
- Web / facility layout: added admin proxy routes for facility layout and reorder operations.
- Web / machine hierarchy: updated `AddCategoryMachineFlow` and related UI polish.
- Web / notifications and visit modals: refined notification presentation and visit-data modal behavior.
- Web / lifecycle helpers: added shared lifetime utility support.

#### Task — design notes
This commit ties together several admin workflow refinements at the branch tip. It depends on the sibling API deployment in this batch for reorder, facility-layout, notification, and lifecycle behavior.

#### Files
```text
17 files changed, 737 insertions(+), 153 deletions(-)
```

#### Tests
Covered by the batch admin build and Vercel production deployment checks.

#### Operator follow-up
Smoke test facility layout/reorder, notifications, and visit-data modals in production.

#### Related
`origin/bhavesh-dev` admin tip. Sibling API tip: `a4911bf`.

### d3a4f15 — chore(deploy): trigger admin production deploy

- **Full SHA:** `d3a4f159e5d04d43c692aa573ddd5f52e545564d`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-07-08T13:36:37Z
- **Author:** jranjan <jranjan2017@gmail.com>
- **Type:** chore
- **Subject:** chore(deploy): trigger admin production deploy

#### Task — context
User explicitly requested a fake commit after merging/pulling Bhavesh's work. Verbatim instruction: "pull commits from kadant-api and kadant-admin from bhavesh-dev merge that to main, and create a fake commit on both proiject and then deploy"

#### Task — what changed
- Deploy / git metadata: created an empty commit on `master` after the `bhavesh-dev` fast-forward.
- Deploy / Vercel production: deployed the pushed admin state to Vercel deployment `dpl_7ctbHbqA5XZpVF5sSzeMZRebJphV`.

#### Task — design notes
The commit intentionally changes no application files. It keeps the latest production branch author on an authorized local account while preserving Bhavesh's commits underneath it.

#### Files
```text
0 files changed
```

#### Tests
- `npm run build` in `kadant-admin` — passed from the clean merged state before push.
- `vercel pull --yes --environment=production` — pulled current production env/project settings.
- `vercel build --prod` — passed and produced `.vercel/output`.
- `vercel deploy --prebuilt --prod --yes` — passed; deployment `dpl_7ctbHbqA5XZpVF5sSzeMZRebJphV` reached `READY`, production URL `https://kadant-admin-48p97uilo-jranjanbiswals-projects.vercel.app`, aliased to `https://kadant-admin.vercel.app`.
- `curl -I -L --max-time 30 https://kadant-admin.vercel.app` — returned `HTTP/2 200`.

#### Operator follow-up
Smoke test the new admin production flows against the freshly deployed API.

#### Related
API deploy-trigger commit: `695d1e0`. API production redeploy completed against `https://13-203-129-207.nip.io`.

## 2026-06-30 — push to origin/master (1 commit)

### aaeceb0 — feat(inventory): sync admin spare part workflows

- **Full SHA:** `aaeceb0cb9a715990dc2399321259c15a4c3dceb`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-06-30T12:30:42Z
- **Author:** jranjan <jranjan2017@gmail.com>
- **Type:** feat
- **Subject:** feat(inventory): sync admin spare part workflows

#### Task — context
User asked to sync the current admin state and ship it live. Verbatim instruction: "let sync everything, push the kadant admin to live"
The local admin tree already contained a broad inventory/client-overview workflow update that had not been pushed. During preflight, matching local API changes were found in `kadant-api`; those API changes were pushed first as `3f46338` so the admin UI would not be ahead of the backend routes it calls.

#### Task — what changed
- Web / `src/app/(authenticated)/[clientID]/spare-parts-inventory/SparePartsInventoryClient.tsx`: synced the spare-parts inventory workflow with rebuild, order-new, replacement, queue, pagination, and richer part state handling.
- Web / `src/app/(authenticated)/[clientID]/spare-parts-inventory/InventoryManagementAddModal.tsx`: added a dedicated add modal for inventory management.
- Web / `src/components` and modal paths under `src/app/components/*`: carried the replacement/rebuild/order-new fields through machine hierarchy, visit data, spare-part edit, machine insight selector, and client overview surfaces.
- Web / `src/app/components/ClientOverview/ClientOverviewContent.tsx`: aligned client overview with the expanded inventory state so replacement/rebuild data stays visible outside the inventory page.
- API proxy / `src/app/api/hidden/rise/*`, `src/app/(fullLayout)/hidden/rise/upload/page.tsx`, `src/lib/rise-auth.ts`: added the hidden RISE image upload page and auth/proxy routes.
- Security / `src/lib/rise-auth.ts`, `src/app/api/hidden/rise/images/route.ts`: removed production credential material from source by requiring `RISE_UPLOAD_*` environment variables in production while leaving development-only fallbacks.
- Types/actions / `src/actions/spare-parts-inventory.ts`, `src/types/client.ts`, `src/types/machine.ts`: added the TypeScript contracts and server actions for replacement options, inventory queues, snapshots, and quote CSV metadata.

#### Task — design notes
The inventory workflow remains client-machine-spare-part centric so spare-parts inventory, client overview, forecasting, and Machine Health can share one canonical set of per-client fields. Replacement state is additive: new fields and history arrays preserve current stock/rebuild behavior while allowing an old installed part to be replaced by a rebuilt or newly ordered part. The hidden RISE uploader is intentionally routed through admin server routes so the browser never receives the internal API secret. Production now requires configured `RISE_UPLOAD_API_SECRET`, `RISE_UPLOAD_PASSWORD_SALT`, and `RISE_UPLOAD_PASSWORD_HASH` instead of hard-coded production secrets.

#### Files
`git show --stat --format="" aaeceb0`

```text
src/actions/spare-parts-inventory.ts               |  177 +++
.../_components/MachineInsightsClient.tsx          |   56 +-
.../InventoryManagementAddModal.tsx                |  303 ++++
.../spare-parts-inventory/SparePartEditDialog.tsx  |   17 +
.../SparePartsInventoryClient.tsx                  | 1646 ++++++++++++++++----
src/app/(fullLayout)/hidden/rise/upload/page.tsx   |  504 ++++++
src/app/api/hidden/rise/auth/route.ts              |   67 +
src/app/api/hidden/rise/images/route.ts            |   83 +
.../machines/spare-parts/[sparePartID]/route.ts    |    4 +-
src/app/api/machines/spare-parts/route.ts          |    4 +-
src/app/components/AppSideBar/AppSideBar.tsx       |    2 +-
.../ClientOverview/ClientOverviewContent.tsx       |  653 +++++++-
.../MachineHierarchy/AddCategoryMachineFlow.tsx    |  219 ++-
.../MachineHierarchy/AddEntityModals.tsx           |   66 +-
src/app/components/MachineInsightSelector.tsx      |    2 +-
src/app/components/Modals/AddMachineModal.tsx      |    1 +
src/app/components/Modals/AddVisitDataModal.tsx    |   19 +-
.../components/Modals/EditSparePartInsights.tsx    |    4 +-
src/app/components/Modals/EditSparePartModal.tsx   |    2 +-
src/app/components/Modals/EditVisitDataModal.tsx   |    8 +-
src/lib/rise-auth.ts                               |   83 +
src/types/client.ts                                |   24 +
src/types/machine.ts                               |   87 +-
23 files changed, 3614 insertions(+), 417 deletions(-)
```

#### Tests
- `rm -rf .next && npm run build` in `kadant-admin` — passed.
- `npx tsc --noEmit` in `kadant-admin` — passed after clean build regenerated Next types.
- `npm run lint` in `kadant-admin` — passed with existing warnings, plus warnings for new hidden RISE page `<img>` usage and one inventory hook dependency warning.
- `git diff --check` in `kadant-admin` — passed.
- Security scan for removed hard-coded RISE secret/hash literals across `kadant-admin/src` and `kadant-api` — no matches.

#### Operator follow-up
Ensure the production Admin and API environments have matching `RISE_UPLOAD_API_SECRET`, and ensure Admin has `RISE_UPLOAD_PASSWORD_SALT` and `RISE_UPLOAD_PASSWORD_HASH`. Deploy or verify deployment of API commit `3f46338` if GitHub push does not automatically update the EC2/PM2 API host.

#### Related
Required API support commit: `3f46338` (`feat(inventory): sync spare part replacement workflows`). Previous admin forecasting pricing commit: `f384fc5`.

## 2026-06-29 — push to origin/master (1 commit)

### f384fc5 — feat(forecasting): add pricing management

- **Full SHA:** `f384fc57e5f33e7458d883ea4694dc9f3a0207ae`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-06-29T12:36:25Z
- **Author:** jranjan <jranjan2017@gmail.com>
- **Type:** feat
- **Subject:** feat(forecasting): add pricing management

#### Task — context
User requested a principal-engineer-style forecasting pricing workflow and deployment. Verbatim instruction: "also there should be a page where i can add the pricing of the spare parts, so in the kadant-admin add another tab forecasting, this is where all things should be listed with pricing, make sure this is synced perfectly with  spare part invetory and client overview page." Follow-up deployment instruction: "push these changes to and deploy"

#### Task — what changed
- Web / `src/app/(authenticated)/[clientID]/forecasting/page.tsx`: added the authenticated client-scoped Forecasting route and loaded the same linked client machines used by spare-parts inventory.
- Web / `src/app/(authenticated)/[clientID]/forecasting/ForecastingPricingClient.tsx`: added a forecasting pricing table across all client machine spare parts, with category/machine/search filters, inline editing for annual new quantity, annual repair quantity, new unit price, and repair price per piece, plus new/repair/total forecast totals and missing-price warnings.
- Web / `src/app/components/AppSideBar/AppSideBar.tsx`: added the Forecasting navigation tab for selected clients.

#### Task — design notes
The page writes to existing `ClientMachineSpareParts` fields through `saveClientSparePart`: `nbNew`, `nbRepair`, `unitPriceNew`, and `priceRepairPerPc`. That keeps forecasting pricing aligned with the spare-parts inventory import/edit model and avoids creating another pricing source. Pricing is client-specific, with machine-health able to fall back to catalog prices when no client override exists. Existing dirty work in the admin repo was deliberately left unstaged; this commit includes only the new forecasting route and sidebar tab.

#### Files
`git show --stat --format="" f384fc5`

```text
.../forecasting/ForecastingPricingClient.tsx       | 664 +++++++++++++++++++++
.../[clientID]/forecasting/page.tsx                |  21 +
src/app/components/AppSideBar/AppSideBar.tsx       |   8 +-
3 files changed, 692 insertions(+), 1 deletion(-)
```

#### Tests
- `npx tsc --noEmit` in `kadant-admin` — passed.
- `npm run build` in `kadant-admin` — passed.
- `npm run lint` in `kadant-admin` — completed with existing unrelated warnings.
- `git diff --cached --check` — passed before commit.

#### Operator follow-up
Deploy `kadant-admin` production from this pushed state and smoke test `/<clientID>/forecasting` pricing saves against spare-parts inventory values.

#### Related
Sibling Machine Health report/PDF commit: `b09fdb2`.

## 2026-06-12 — push to origin/master (1 commit)

### 97f8399 — feat(rebuild): manage spare part rebuild metadata

- **Full SHA:** `97f83996aac0349fd7b6cb6d2042c89ba14ebf3b`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-06-12T06:31:43Z
- **Author:** jranjan <jranjan2017@gmail.com>
- **Type:** feat
- **Subject:** feat(rebuild): manage spare part rebuild metadata

#### Task — context
User requested the Kadant rebuild workflow end to end and then deployment. Relevant verbatim instructions included: "now let me explain this is a major change that needs to be taken care of so there are machine categories, with machines in it and machines have spare parts. now initially the machines are installed new, then they can be send to rebuild, and rebuild have a different delivery time compared to the newly installed." Follow-up admin/client-overview instructions included: "show installation date and last service on as well in the spare parts", "remove the cross and tick icon from health column", and "in the spare part table dont show the machine naem remove it". The final deployment instruction was: "lets deploy this".

#### Task — what changed
- Web / `src/actions/spare-parts-inventory.ts`: preserved rebuild metadata from spare-part inventory edits/imports so admin can manage rebuild-specific fields alongside existing spare-part cost and timing data.
- Web / `src/app/(authenticated)/[clientID]/spare-parts-inventory/CsvImportWizard.tsx`: surfaced rebuild fields in CSV import preview/mapping so spreadsheet imports can carry rebuild status, rebuild delivery timing, and rebuild cost data.
- Web / `src/app/(authenticated)/[clientID]/spare-parts-inventory/SparePartEditDialog.tsx`: added rebuild metadata controls to the spare-part edit modal while keeping existing inventory edit behavior intact.
- Web / `src/app/components/ClientOverview/ClientOverviewContent.tsx`: refined the expanded spare-parts table UI, showing installation date and last service date, removing the machine-name repetition, simplifying the health tag, and allowing spare-part names to wrap cleanly.

#### Task — design notes
The admin changes keep rebuild metadata as an additive extension of existing client-machine spare-part records rather than replacing current stock/cost fields. The client-overview spare-part table was kept dense and operational, with narrower columns and simpler health tags to match the repeated-use admin workflow. Existing actions and routing were preserved so current spare-part inventory and client overview behavior remains compatible.

#### Files
`git show --stat --format="" 97f8399`

```text
src/actions/spare-parts-inventory.ts               |   7 +
.../spare-parts-inventory/CsvImportWizard.tsx      |   9 ++
.../spare-parts-inventory/SparePartEditDialog.tsx  |  65 ++++++++++
.../ClientOverview/ClientOverviewContent.tsx       | 144 +++++++++++++--------
4 files changed, 173 insertions(+), 52 deletions(-)
```

#### Tests
- `npm run build` in `kadant-admin` — passed.
- `git diff --check` — passed.
- Local UI was iteratively checked on `http://localhost:4000/69fa3cd3894ab16ae9bbb582/client-overview` while refining the spare-part table.

#### Operator follow-up
Deploy `kadant-admin` to Vercel production from this pushed state and smoke test the client-overview/spare-parts inventory pages.

#### Related
Sibling API rebuild commit: `6b2e4cb`. Sibling Machine Health rebuild/forecasting commit: `b0118d6`.

## 2026-06-04 — fifth push to origin/master (1 commit)

### 47d3a91 — fix(image-upload): separate selection from preview view

- **Full SHA:** `47d3a917ed8f42a619183d3d206f715faadb265b`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-06-04T07:17:35Z
- **Author:** jranjan <jranjan2017@gmail.com>
- **Type:** fix
- **Subject:** fix(image-upload): separate selection from preview view

#### Task — context
User reported a regression after the large image viewer was added to the shared upload modal. Verbatim instruction: "only when i click on view button the iimage big view should open, the issue is i am not able to select the images"
The previous implementation made the entire original/compressed image preview area open the large viewer, which meant a normal click on the preview no longer selected the image version to save.

#### Task — what changed
- Web / `src/app/components/MachineHierarchy/ImageUploadModal.tsx`: changed Current Image preview from an all-over view button into a passive image area with a dedicated `View` button.
- Web / `src/app/components/MachineHierarchy/ImageUploadModal.tsx`: changed Original and Compressed cards so the card/preview area selects that upload choice again.
- Web / `src/app/components/MachineHierarchy/ImageUploadModal.tsx`: moved the large-preview action onto the small `View` button only, with click propagation stopped so it does not also change selection.
- Web / `src/app/components/MachineHierarchy/ImageUploadModal.tsx`: kept keyboard selection support on the Original/Compressed cards through `Enter` / `Space`.

#### Task — design notes
The interaction now separates two user intents: click the card to choose the image that will be saved, click `View` to inspect it larger. This keeps the new large preview feature without breaking the older save-selection workflow.

#### Files
`git show --stat --format="" 47d3a91`

```text
.../MachineHierarchy/ImageUploadModal.tsx          | 110 +++++++++++++++------
1 file changed, 79 insertions(+), 31 deletions(-)
```

#### Tests
- `npx tsc --noEmit` — passed.
- `git diff --check` — passed.
- `npm run lint` — passed with existing unrelated warnings.
- Local browser verification on `http://localhost:4000/69fa3cd3894ab16ae9bbb582/client-overview`: opened Facility Image upload modal, clicked the current image area away from the `View` button and confirmed no large preview opened; clicked `View current image` and confirmed the large preview opened.

#### Operator follow-up
Deploy `kadant-admin` to Vercel production after the ledger commit is pushed.

#### Related
Previous shared image modal deployment: `b18e71e`.

## 2026-06-04 — push to origin/master (1 commit)

### b18e71e — fix(client-overview): improve client images and spare part data

- **Full SHA:** `b18e71ecbd0609db59c72ba1bc902280acce6c68`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-06-04T07:07:41Z
- **Author:** jranjan <jranjan2017@gmail.com>
- **Type:** fix
- **Subject:** fix(client-overview): improve client images and spare part data

#### Task — context
User requested deploying the current work across the Kadant projects. Verbatim instruction: "now let deploy this for all the projects."
This admin commit bundles the local changes prepared during the same session: spare-parts inventory schedule metadata from the provided CSV, client-details owner/login mapping corrections, safer client image upload handling, and the final request to add a much larger "View" experience to every shared upload-image modal.

#### Task — what changed
- Web / `src/app/components/MachineHierarchy/ImageUploadModal.tsx`: moved the shared upload modal into a high-z-index portal, replaced the hidden label upload target with an explicit button trigger, enlarged the original/compressed previews, added `View` actions for current/original/compressed images, and added a full-screen large image viewer above nested dialogs.
- Web / `src/app/components/MachineHierarchy/ImageUploadModal.tsx`: added saved-image size validation support and fixed blob URL lifecycle management so the original selected image remains loadable in the large viewer after compression finishes.
- Web / `src/app/components/Modals/EditClientDetails.tsx`: wired home/facility image changes through the shared compression modal and enforced the requested 10 MB saved-image cap/copy for those client images.
- Web / `src/app/components/ClientManagement/*`, `src/actions/update-client-credentials.ts`, `src/types/client.ts`: corrected client details to surface the client-role login/owner information and update owner display without exposing unrelated admin credentials.
- Web / `src/app/(authenticated)/[clientID]/spare-parts-inventory/*`: added/editable maintenance schedule fields used for spare-part forecast timing, including CSV import and weekly planning UI updates.
- Web / `src/app/components/ClientOverview/ClientOverviewContent.tsx`: carried the client overview image/data integration changes needed by the latest modal workflow.

#### Task — design notes
The image viewer was implemented in the shared `ImageUploadModal` so every upload-image modal benefits at once instead of duplicating client-overview-only code. The large viewer uses a second top-level overlay with the same maximum z-index and click/Escape close behavior, which avoids the Radix parent dialog swallowing clicks. Original/compressed cards separate "view image" from "choose saved version" so previewing does not accidentally change the selected upload. Client image size validation stays per-caller through `maxSavedBytes`, preserving full-size behavior for other modal consumers.

#### Files
`git show --stat --format="" b18e71e`

```text
src/actions/update-client-credentials.ts           |  52 +++
.../spare-parts-inventory/CsvImportWizard.tsx      |  56 +++-
.../MaintenanceScheduleEditor.tsx                  |  39 ++-
.../SparePartsInventoryClient.tsx                  | 206 ++++++------
.../ClientManagement/ClientManagementPage.tsx      |  10 +-
.../ClientManagement/ViewCustomerDetails.tsx       |  41 ++-
.../ClientManagement/modals/ChangeOwnerModal.tsx   |  66 ++--
.../ClientOverview/ClientOverviewContent.tsx       |  13 +-
.../MachineHierarchy/ImageUploadModal.tsx          | 234 +++++++++++---
src/app/components/Modals/EditClientDetails.tsx    | 354 ++++++++++-----------
src/types/client.ts                                |  18 +-
11 files changed, 679 insertions(+), 410 deletions(-)
```

#### Tests
- `npx tsc --noEmit` — passed.
- `git diff --check` — passed.
- `npm run lint` — passed with existing unrelated warnings.
- Local browser verification on `http://localhost:4000/69fa3cd3894ab16ae9bbb582/client-overview`: opened Edit Client & Machine Details, opened Facility Image upload modal above the parent dialog, verified `View current image` opens the large preview with the real facility image loaded at natural dimensions `3150 x 1851` and rendered about `904 x 531` inside the large preview panel.

#### Operator follow-up
Deploy `kadant-admin` to Vercel production after the ledger commit is pushed.

#### Related
Sibling API commit: `b0505d5`. Sibling Machine Health commit: `e0d8c2b`.

## 2026-06-04 — fourth push to origin/master (1 commit)

### 57b8af6 — Merge remote-tracking branch 'origin/bhavesh-dev'

- **Full SHA:** `57b8af63b70f759c079851a6ef2d2bfc1272c757`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-06-03T23:32:29Z
- **Author:** jranjan <jranjan2017@gmail.com>
- **Type:** merge
- **Subject:** Merge remote-tracking branch 'origin/bhavesh-dev'

#### Task — context
User requested merging the `bhavesh-dev` branch into the mainline and deploying both frontend apps. Verbatim instruction: "take pull from bhavesh-dev and merge it to main and then deploy both frontend on vercel"
The `kadant-admin` frontend uses `master` as its mainline branch. The repo was clean, `origin/master` was up to date, and `origin/bhavesh-dev` had advanced before the merge.

#### Task — what changed
- Git / branch management: fetched `origin`, fast-forward checked `master` against `origin/master`, and merged `origin/bhavesh-dev` into `master` with the default `ort` strategy.
- Web / `src/app/[clientID]/client-overview/page.tsx`: merged client overview changes from `bhavesh-dev`.
- API / `src/app/api/machines/machine-category/route.ts`: merged machine-category route changes from `bhavesh-dev`.
- Web / `src/app/components/MachineHierarchy/AddCategoryMachineFlow.tsx`: merged hierarchy editor change from `bhavesh-dev`.
- Web / `src/app/components/MachineHierarchy/MachineImageMapper.tsx`: merged image mapper styling/behavior change from `bhavesh-dev`.
- Merged commits from `origin/bhavesh-dev`: `9a74c53 fix(admin): fix machine name text color to white in Map Machine Positions`; `94c23c0 feat(client-overview): isolate category data per client`.

#### Task — design notes
The merge was clean, so no conflict resolution or manual code edits were needed. The mainline branch is named `master`, not `main`, so the requested mainline merge and push were performed on `master`.

#### Files
`git show --stat --format="" 57b8af6`

```text
.../[clientID]/client-overview/page.tsx                | 18 +++++-------------
src/app/api/machines/machine-category/route.ts         |  4 ++--
.../MachineHierarchy/AddCategoryMachineFlow.tsx        |  2 +-
.../components/MachineHierarchy/MachineImageMapper.tsx |  2 +-
4 files changed, 9 insertions(+), 17 deletions(-)
```

#### Tests
- `npm run build` in `kadant-admin` — passed locally after the merge (Next workspace-root warning only).

#### Operator follow-up
Deploy the merged frontend to Vercel production as requested in the same user task.

#### Related
Merged branch tip: `94c23c0`. Sibling frontend merge: `machine-health` `bb6b28e`.

## 2026-06-04 — third push to origin/master (1 commit)

### 46ecb17 — chore(client-management): update add customer form

- **Full SHA:** `46ecb1758839c9a0c2f721bd40a7fa035d95d4be`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-06-03T23:19:56Z
- **Author:** jranjan <jranjan2017@gmail.com>
- **Type:** chore
- **Subject:** chore(client-management): update add customer form

#### Task — context
The working tree had one remaining local change in the admin repo after the Upload Data spare-part fixes were shipped and logged. Verbatim instruction: "do git add . and then commit and push to main/master branch"
The workspace root is not a git repository, so the command was run in the active `kadant-admin` repository on the current `master` branch.

#### Task — what changed
- Web / `src/app/components/ClientManagement/AddCustomerForm.tsx`: changed the first account field label from `Username` to `Email`.
- Web / `src/app/components/ClientManagement/AddCustomerForm.tsx`: commented out the Onboarding Images section and the Add Machine Details section in the add-customer flow.
- Web / `src/app/components/ClientManagement/AddCustomerForm.tsx`: renumbered the remaining Business Details, Flowsheet Image, and Stock Preparation Image sections to keep the visible sequence continuous.

#### Task — design notes
This commit intentionally preserved the exact local form edits that were already present and used `git add .` as requested. No unrelated Upload Data files were dirty at the time; those changes had already been committed and pushed in earlier commits. No deploy was performed for this git-only request.

#### Files
`git show --stat --format="" 46ecb17`

```text
src/app/components/ClientManagement/AddCustomerForm.tsx | 16 ++++++++--------
1 file changed, 8 insertions(+), 8 deletions(-)
```

#### Tests
Not run. The user specifically requested staging, committing, and pushing the current local changes.

#### Operator follow-up
None.

#### Related
Previous source commit in the same session: `ce956a1` (Upload Data spare-part date fields).

## 2026-06-04 — second push to origin/master (1 commit)

### ce956a1 — fix(upload-data): add spare part service dates

- **Full SHA:** `ce956a1f4d99b91dd48181d6d6f314c3c313a36f`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-06-03T23:17:32Z
- **Author:** jranjan <jranjan2017@gmail.com>
- **Type:** fix
- **Subject:** fix(upload-data): add spare part service dates

#### Task — context
Follow-up to the Client Overview spare-part edit routing fix on the production client page
`https://kadant-admin.vercel.app/69fa3cd3894ab16ae9bbb582/client-overview`.
Verbatim instruction: "also in `upload data` tab there is `spare parts` for spare parts add installation data and last service date as well"
Prior Upload Data spare-part editors only exposed the catalog fields (name/KL), image/video media, and child parts. The backend already had client-specific spare-part detail fields, but the admin UI did not load or save them from the hierarchy editor.

#### Task — what changed
- Web / `src/app/components/MachineHierarchy/AddCategoryMachineFlow.tsx`: added `lastServiceDate` and `sparePartInstallationDate` to spare-part editor state, baseline tracking, unsaved-change detection, and the expanded spare-part form. Existing spare parts now hydrate those dates from `/api/clients/:clientID/machines/:machineID/spare-parts`, and save date changes through the existing client spare-part PUT route.
- Web / `src/app/components/MachineHierarchy/AddCategoryMachineFlow.tsx`: when editing all data, date-only spare-part changes are persisted as client-specific spare-part metadata; when adding or updating a single spare part, the same date fields are sent after the spare part exists.
- Web / `src/app/components/MachineHierarchy/AddEntityModals.tsx`: added Installation Date and Last Service Date inputs to the Add Spare Part modal and save them for the current client/machine/spare-part when provided.
- Deploy: published from a clean detached worktree at `ce956a1` to avoid bundling the unrelated local `AddCustomerForm.tsx` edit. Vercel production deployment `https://kadant-admin-982o8l9ny-jranjanbiswals-projects.vercel.app` was aliased to `https://kadant-admin.vercel.app`.

#### Task — design notes
The date fields are client-specific operational metadata, so the UI uses the existing client spare-part API instead of extending the global spare-part catalog payload. The hierarchy editor hydrates dates per saved machine because the category full endpoint returns catalog hierarchy data, while the client spare-part route returns per-client details. Per-machine hydration failures are logged and leave the catalog editor usable rather than blocking all Upload Data editing.

#### Files
`git show --stat --format="" ce956a1`

```text
.../MachineHierarchy/AddCategoryMachineFlow.tsx    | 173 ++++++++++++++++++---
.../MachineHierarchy/AddEntityModals.tsx           |  31 +++-
2 files changed, 180 insertions(+), 24 deletions(-)
```

#### Tests
- `npx tsc --noEmit` — passed.
- `npm run build` — passed locally (Next workspace-root warning only).
- Local browser smoke: logged into `http://localhost:4000`, opened Upload Data on the reported client, expanded `Pulping & HDC` and `Vokes rotor 86,4" - KBC - X4CrNi13.4`, and verified Installation Date and Last Service Date fields rendered; the installation date hydrated as `2026-05-27`.
- Production browser smoke after deploy: opened `https://kadant-admin.vercel.app/69fa3cd3894ab16ae9bbb582/client-overview`, switched to Upload Data, expanded `Pulping & HDC` and the same `Vokes rotor...` spare part, and verified both date labels were present with date input values `[2026-05-27, ""]`.

#### Operator follow-up
None.

#### Related
Previous fix: `10a6a6f` (Overview spare-part edit opens Upload Data with the target spare part focused).

## 2026-06-04 — push to origin/master (1 commit)

### 10a6a6f — fix(client-overview): open upload editor for spare part edits

- **Full SHA:** `10a6a6fac20bbcc1754a681bcb27861b8be5b93f`
- **Branch:** master
- **Pushed to:** origin/master
- **Pushed at:** 2026-06-03T23:02:36Z
- **Author:** jranjan <jranjan2017@gmail.com>
- **Type:** fix
- **Subject:** fix(client-overview): open upload editor for spare part edits

#### Task — context
User reported the production Client Overview page:
`https://kadant-admin.vercel.app/69fa3cd3894ab16ae9bbb582/client-overview`.
Verbatim instruction: "on page link : https://kadant-admin.vercel.app/69fa3cd3894ab16ae9bbb582/client-overview issue there is spart parts listed in `overview` tab, there is edit button on click it should take to `upload data` page with proper spare parts open !"
Prior behavior opened the old `EditSparePartModal` from the Overview tab, so admins were not taken to the full Upload Data hierarchy editor where the spare-part media, parts, and catalog fields are managed.

#### Task — what changed
- Web / `src/app/components/ClientOverview/ClientOverviewContent.tsx`: replaced the Overview spare-part edit modal path with `openUploadEditor(categoryId, machineId, sparePartId)`, which switches to the Upload Data tab, expands the correct category card, and passes a focus target into the hierarchy editor. Machine edit buttons now also focus the relevant machine in Upload Data. Manual category/add flows clear stale focus targets.
- Web / `src/app/components/MachineHierarchy/AddCategoryMachineFlow.tsx`: added `focusTarget` support with machine/spare-part IDs plus a request counter; after edit data loads, the editor opens the matching machine and spare-part accordions, scrolls the target into view, and applies a subtle ring to the focused card.
- Web cleanup: removed the now-unused Overview spare-part modal import/state/save handler/render from `ClientOverviewContent`.
- Deploy: published the fix to Vercel production via `vercel --prod --yes`; deployment `https://kadant-admin-o7kb5hutr-jranjanbiswals-projects.vercel.app` was aliased to `https://kadant-admin.vercel.app`.

#### Task — design notes
The handoff passes category, machine, and spare-part IDs from the Overview row instead of making the Upload Data editor infer context. This avoids collisions when spare-part names repeat and preserves the existing `AddCategoryMachineFlow` data loading path. A request counter allows repeated clicks on the same spare part to refocus the editor even if the target IDs are unchanged.

#### Files
`git show --stat --format="" 10a6a6f`

```text
.../ClientOverview/ClientOverviewContent.tsx       | 134 ++++-----------------
.../MachineHierarchy/AddCategoryMachineFlow.tsx    |  58 ++++++++-
2 files changed, 81 insertions(+), 111 deletions(-)
```

#### Tests
- `npx tsc --noEmit` — passed.
- `npm run build` — passed locally (Next workspace-root warning only).
- Local browser smoke: logged into `http://localhost:4000`, opened the reported client overview, expanded `Hydrapulper 11DR - 1902573.01`, clicked the first spare-part edit button, and verified Upload Data selected with `Pulping & HDC` / `Hydrapulper 11DR - 1902573.01` / `Vokes rotor 86,4" - KBC - X4CrNi13.4` open and editable.
- Production browser smoke after deploy: repeated the same non-destructive click path on `https://kadant-admin.vercel.app/69fa3cd3894ab16ae9bbb582/client-overview`; verified `machineClicked=true`, `spareEditClicked=true`, Upload Data selected, and the `Vokes rotor...` spare-part card focused/open with its fields visible.

#### Operator follow-up
None.

#### Related
None.

## 2026-06-02 — push to origin/master (1 commit)

### 0bafe73 — fix(image-mapper): capture image natural dims for cached images (boxes were hidden)
- Full SHA `0bafe7371e9d4fafae3580de899879e3f46a0b79` · branch master · remote origin
- Pushed 2026-06-02 15:42:05 +0530 · author jranjan · type: fix (frontend/geometry)
- Why: after the image-normalized coordinate rewrite (3e9969f), live browser testing on
  prod found the mapper rendered **0 boxes** even though the category had 3 mapped
  machines and the `<img>` was fully loaded (complete, naturalWidth 3840×2160, container
  1399×859). Root cause: the natural-dimensions state is populated from the image's
  `onLoad` handler, but `onLoad` does NOT fire for an **already-cached** image — so on
  revisit the natural dims stayed `null`, `coverRect` returned `null`, and every box was
  hidden by the `if (!coverGeom) return null` guard. The drift fix was correct but
  invisible because boxes never mounted.
- What: in the ResizeObserver/mount effect, after grabbing the container element, also
  query its child `<img>` and, if `img.complete && img.naturalWidth && img.naturalHeight`,
  seed the natural state immediately — covering the cached-image case the `onLoad` path
  misses. `onLoad` still handles the cold-load case.
  ```tsx
  const img = el.querySelector("img");
  if (img && img.complete && img.naturalWidth && img.naturalHeight) {
      setNatural({ iw: img.naturalWidth, ih: img.naturalHeight });
  }
  ```
- Design notes: mirrors the byte-identical guard added to machine-health StockPreparation
  (5c989c1) so both apps recover cached natural dims the same way. Considered next/Image
  `onLoadingComplete` but the plain `complete` check is the robust cross-path fix. Rejected polling.
- git show --stat: `src/app/components/MachineHierarchy/MachineImageMapper.tsx | 8 ++++++++`
  (1 file, +8).
- Tests / verification: deployed to prod (kadant-admin.vercel.app); opened mapper on
  category "Pulping & HDC" (3840×2160 image, 3 mapped machines) → **3 boxes now render**
  at norms [29.1,30.6] [14.4,46.8] [63.4,54.8]. Decisive round-trip check: those
  live-derived norms exactly equal the DB-stored machinePositions (left/top), proving the
  cover transform is applied correctly in the real DOM. Cross-size tracking proven by the
  swarm numeric harness (maxNormDiff < 1.8e-12 across container sizes) + byte-identical
  coverGeometry in both apps; a live viewport-resize test was blocked only by the fixed
  Chrome viewport in the automation env.
- Operator follow-up: re-map the 4 categories that hold legacy positions (Pulping & HDC,
  LF CLEANING, + 2 test categories) — the coordinate MEANING changed from container-% to
  image-normalized, so old values must be re-placed once.
- Related: 3e9969f (the coordinate rewrite this unblocks); machine-health 5c989c1 (twin fix).

### 3e9969f — fix(image-mapper): box positions by image-normalized coords + cover transform
- Branch master · remote origin · type: fix (frontend/geometry)
- Why: machine boxes placed in the Upload Data image mapper drifted off the machines
  on machine-health across device sizes. Root cause: boxes stored as % of the
  CONTAINER while the image is object-fit:cover / object-position:bottom; the
  container aspect ratio differs (admin mapper = full viewport; machine-health =
  full-screen panel) and varies per device, so cover crops differently and the same
  % lands on a different IMAGE point.
- What: coordinates normalized to the image natural pixels, rendered via a shared
  cover transform (scale=max(cw/iw,ch/ih); offX=(cw-rw)*0.5; offY=(ch-rh)*1.0) using
  image natural size (onLoad) + ResizeObserver container size.
  - NEW src/app/components/MachineHierarchy/coverGeometry.ts (coverRect/normToPx/pxToNorm/pxDeltaToNorm)
  - MachineImageMapper.tsx: click/drag/resize convert to image-norm; markers rendered
    in px via normToPx; boxes guarded until natural dims load; removed dead containerRef prop.
- Verified (orchestrate-pro swarm, 10 agents): numeric round-trip <1.8e-12, extreme
  aspect ratios, byte-identical cross-app helper, no UI regressions; tsc 0 errors, eslint clean.
- Follow-up: re-map the 4 categories that have existing positions (meaning changed
  container-% -> image-%); DB field/shape unchanged. Deploy: `vercel --prod` from kadant-admin/.
- Sibling commit: machine-health 4f01138 (identical coverGeometry.js + StockPreparation.js).
