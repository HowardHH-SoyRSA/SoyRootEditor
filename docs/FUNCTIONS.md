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

## Edit the graph

The toolbar and shortcuts expose nine operations:

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
