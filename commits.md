# Commit Ledger (committed; read by future sessions)

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
