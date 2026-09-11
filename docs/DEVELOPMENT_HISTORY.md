# SoyRootEditor development and update history

This log summarizes the implementation history included in the SoyRootEditor
source snapshot. Dates are repository commit dates in China Standard Time.

| Date | Commit | Update |
| --- | --- | --- |
| 2026-07-09 | `63e9be7` | Established the BioInsAlgo package, I/O contracts, and test data. |
| 2026-07-14 | `54e0eb4` | Refined primary-root centreline tracing. |
| 2026-07-15 | `9411752` | Added the focused Windows desktop batch GUI. |
| 2026-07-24 | `07ae652`, `737c797` | Published the SoyRootArchitect source/build line. |
| 2026-07-25 | `fcfa42a`, `7de2bee`, `d193f52`, `6746335` | Corrected directional angles and expanded root-visualization exports. |
| 2026-07-26 | `cddd7c3` | Improved primary-guidance selection and reuse in the GUI. |
| 2026-09-02 | `f3a4564` | Published the full-resolution local 3D viewer and graph editor. |
| 2026-09-03 | `2c60cd8` | Enforced hierarchy-length constraints and cleaned primary surface patches. |
| 2026-09-05 | `4caf010` | Added reusable guidance snapshots and runtime reporting. |
| 2026-09-08 | `f1ec9aa` | Preserved adjacent-root surface tracking and its regression tests. |
| 2026-09-09 | Working tree | Added desktop viewer launch, transactional dataset switching, recent datasets, and independent multi-window sessions. |
| 2026-09-11 | Working tree | Added junction hover/click inspection and an atomic, undoable outgoing parent/child-arm switch with corrected topology, point labels, root orders and measurements. |

## Current feature status

The viewer/editor line is implemented and covered by automated tests:

- Full-resolution labelled PLY viewing with WebGL, background PLY parsing,
  smooth-normal calculation, and a background spatial picking index.
- Root hover information, hierarchy selection, complete-root highlighting,
  parent/child context, patch selection, and root metrics.
- SoyRootBio export colours and legend, continuous wheel zoom, primary-root
  rotation target, and camera preservation after edits.
- Create-from-unassigned-path, split, merge, assign, reconnect, reparent,
  delete, redraw, and root-order correction.
- Junction rings, multi-child junction inspection, and continuation-arm
  correction with downstream attachment remapping and preserved camera view.
- Durable undo/redo, immutable automatic results, append-only operation logs,
  hashed point-selection blobs, and materialised PLY/JSON/CSV/RSML exports.
- Loopback-only Python API with a same-site session token and protected export
  paths.
- Desktop viewer shortcut, in-viewer dataset selection, log-safe switching,
  multi-window editing, and read-only protection for duplicate sessions.

## Verification at this snapshot

- Python test suite: 238 tests passed, including junction splicing, primary-root
  identity, shared attachment sites and self-contacts, downstream orders, point labels, atomic
  rejection, read-only protection, durable-log failure, undo/redo, replay and
  edited PLY/RSML hierarchy checks.
- Editor TypeScript typecheck: passed.
- Static Vite build: passed.
- Rendered editor checks: 11 tests passed.
- ESLint: passed. Live isolated fixture: visible junction rings, hover tooltip,
  canvas click, child selection, switch, undo/redo and unchanged camera view
  verified; no browser console warnings/errors. Real-dataset contact-region
  assignment review and very-large-mesh junction performance remain untested.

## Pending work

- Publish this snapshot as the `SoyRootEditor` GitHub repository and attach the
  Windows packages as a release asset.
- Add CI builds for the Windows installer and automated frontend/backend checks.
- Reduce the approximately 890 KB minified editor entry chunk through code
  splitting when packaging performance becomes a priority.
- Validate very large meshes on a range of integrated and discrete GPUs.
