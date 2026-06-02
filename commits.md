# Commit Ledger (committed; read by future sessions)

## 2026-06-02 — push to origin/master (1 commit)

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
