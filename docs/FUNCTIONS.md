# SoyRootEditor functions

SoyRootEditor is a local Windows viewer and graph editor for completed
SoyRootBio result bundles. It keeps the automatic result read-only and stores
human corrections separately.

## Open a result

After installation, open a result bundle with:

```powershell
soyrootbio editor --output "D:\results\sample"
```

The desktop shortcut or `soyrootbio editor` opens the viewer with a folder
chooser. The **Dataset** selector beside the active-dataset name provides
recent folders, browsing, switching, and an additional-window action.

The directory should contain `segmented_root_structure.ply`,
`root_hierarchy.json`, `root_traits.csv`, and the other SoyRootBio outputs.

When switching, the next bundle is validated before the previous operation log
is flushed and closed. A failed switch retains the previous dataset. Unfinished
Create and Redraw paths present Finish, Discard, and Cancel choices. Separate
viewer windows have independent camera and edit state. Opening the same session
twice produces a read-only duplicate, preventing concurrent log writes.

## Inspect and navigate

- Hover over the 3D surface to see the root ID, length, diameter, and
  tip–gravity angle.
- Select a root in the 3D view or hierarchy to highlight and frame its full
  centreline, parent, direct children, insertion point, and tip.
- Select connected uncertain or unassigned patches from the left panel.
- Use the search field to find a root or patch.
- Use ordinary left-dragging to orbit and the wheel/trackpad to zoom.
- The initial orbit target is the geometric centre of the primary root.
- In Inspect mode, cyan rings mark graph junctions. Hover to see the parent,
  child arms, centreline-node index and source coordinates; click to open the
  junction inspector. Rings are an x-ray overlay visible through root surfaces,
  not a depth measurement. A root's inspector also lists its junction sites.

## Edit the graph

The toolbar and shortcuts expose these tools:

| Operation | Shortcut | Purpose |
| --- | --- | --- |
| Create | `0` | Draw a base-to-tip path through grey unassigned points and attach it to the selected parent. |
| Inspect | `1` | Select and frame a root or point patch. |
| Split | `2` | Split a centreline at the nearest path point. |
| Merge | `3` | Join a compatible locally connected root while retaining the selected root ID. |
| Assign | `4` | Assign a continuous 3D brush region to a selected root. |
| Reconnect | `5` | Connect a detached root to a new connection point. |
| Reparent | `6` | Attach a root beneath a new parent. |
| Delete | `7` | Delete a non-primary root after confirmation. |
| Redraw | `8` | Replace a root centreline using selected surface points. |
| Order | `9` | Correct a root's order in the inspector. |

In Assign mode, **Shift + left-drag** paints one continuous, atomic brush
operation. A normal left-drag continues to orbit the model. `Ctrl+Z` and
`Ctrl+Shift+Z` undo and redo accepted edits.

### Correct the parent continuation at a junction

1. Choose **Inspect** (`1`) and click a cyan junction ring (or a junction in
   the selected root's inspector).
2. Choose the child arm that should instead continue the parent. At a
   multi-child junction, only this chosen arm is exchanged.
3. Click **Switch parent / child arms**. The camera does not move.

This exchanges outgoing arms, not just names or parent-ID fields. The proximal
parent path and its root ID are retained, and its centreline continues along
the chosen child arm. The previous parent continuation takes the child's ID.
Roots attached to either outgoing arm follow that physical arm; roots attached
before or exactly at the junction remain on the proximal parent. Exact graph
attachment indices are remapped, avoiding nearest-point jumps at self-contacts.

Parent/child links, downstream orders, surface-point ownership and measurements
are updated in one `swap_junction_branches` operation. Affected child-subtree
manual order overrides are cleared; unrelated overrides are preserved.
Point ownership uses the same nearest-centreline-node partition as Split, with
junction ties retained by the proximal parent. Uncertain/unassigned points are
not claimed. Review surface assignments near crowded contacts after a swap.

The primary root can participate, but keeps its basal point, ID and order 0.
Terminal attachments without a parent continuation cannot be exchanged. Existing
topology and child-length constraints still apply: an invalid switch is rejected
atomically with a reason, leaving the prior result and log unchanged.
Undo/redo and saved-log replay restore the complete correction, and edited
PLY/JSON/CSV/RSML exports include the corrected graph. Older software versions
cannot replay this new operation; keep the updated viewer with these sessions.

After updating the source installation, restart the local viewer server (not
just the browser tab) to load the new operation handler.

## Data safety and export

- Automatic PLY, hierarchy, traits, and RSML outputs are opened read-only.
- Each session has a source fingerprint and an append-only `operations.jsonl`
  history. Large point sets are stored as hashed NumPy sidecar blobs.
- Every accepted edit is flushed to disk. Switching datasets closes the prior
  session after the next dataset has passed validation.
- **Export edits** writes a separate materialised bundle containing the edited
  labelled PLY, hierarchy JSON, CSV traits/label map, nested RSML, operation
  log, blobs, and manifest. The automatic result is never overwritten.
- RSML and hierarchy exports retain parent/child order for archiDART- and
  VRoot-style interchange workflows.

## Colour contract

The viewer inherits the colours written by SoyRootBio exports:

| Class | Colour |
| --- | --- |
| Primary (O0) | `#0D3BE0` |
| First order (O1) | `#FF00FF` |
| Second order (O2) | `#009E73` |
| Third order (O3) | `#8C33D1` |
| Higher order (O4+) | `#F2A614` |
| Uncertain | `#FA7A0D` |
| Unassigned | `#8C8C8C` |

Cyan junction rings are a viewer-only overlay; exported root colours are unchanged.
