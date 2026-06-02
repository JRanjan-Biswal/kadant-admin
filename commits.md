# Commit Ledger (committed; read by future sessions)

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
