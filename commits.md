# Commit Ledger (committed; read by future sessions)

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
