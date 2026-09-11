"""Junction corrections preserve physical arms, point ownership and history."""
from __future__ import annotations

import json
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np
import pandas as pd
import pytest

from soyrootbio.editor.ply import read_labeled_ply
from soyrootbio.editor.session import EditorSession, EditorValidationError
from test_editor_session import (
    editor_bundle, fixed_hardware, _new_session, _materialised_snapshot, _file_digests,
)


SWAP = {"parent_id": "root-a", "child_id": "root-c", "insertion_index": 1}


@pytest.fixture
def branching_bundle(editor_bundle: Path) -> Path:
    """Include basal, co-located, distal and nested attachments on both arms."""
    path = editor_bundle / "root_hierarchy.json"
    hierarchy = json.loads(path.read_text(encoding="utf-8"))
    by_id = {root["root_id"]: root for root in hierarchy["roots"]}
    rows = []
    for label, (root_id, parent_id, index, offset) in enumerate([
        ("proximal", "root-a", 0, [0, -0.2, 0]),
        ("co-located", "root-a", 1, [0, -0.2, 0]),
        ("distal", "root-a", 2, [0, -0.2, 0]),
        ("child-side", "root-c", 1, [0.2, 0, 0]),
        ("nested", "child-side", 1, [0, 0, -0.1]),
    ], start=4):
        parent = by_id[parent_id]
        base = np.array(parent["polyline"][index])
        row = {
            "root_id": root_id,
            "parent_id": parent_id,
            "root_order": parent["root_order"] + 1,
            "polyline": [base.tolist(), (base + offset).tolist()],
            "insertion_point": base.tolist(),
            "insertion_index": index,
        }
        hierarchy["roots"].append(row)
        by_id[root_id] = row
        rows.append({"root_id": root_id, "numeric_label": label,
                     "parent_id": parent_id, "root_order": row["root_order"]})
    path.write_text(json.dumps(hierarchy), encoding="utf-8")
    label_path = editor_bundle / "csv/root_label_map.csv"
    pd.concat([pd.read_csv(label_path), pd.DataFrame(rows)], ignore_index=True).to_csv(label_path, index=False)
    return editor_bundle


def test_junction_metadata_groups_shared_sites(branching_bundle: Path) -> None:
    session = _new_session(branching_bundle)
    junction = next(j for j in session.public_state()["junctions"]
                    if j["junction_id"] == "junction:root-a:1")
    assert junction["child_ids"] == ["co-located", "root-c"]
    assert junction["parent_id"] == "root-a"
    assert junction["position"] == [0.5, 0, 3]
    assert junction["can_swap"] is True
    assert all(j["child_ids"] for j in session.public_state()["junctions"])


def test_swap_splices_arms_and_reparents_only_their_descendants(branching_bundle: Path) -> None:
    before_files = _file_digests(branching_bundle)
    session = _new_session(branching_bundle)
    # Affected manual overrides are invalidated; unrelated overrides survive.
    session.apply_operation("correct_root_order", {"root_id": "child-side", "root_order": 7})
    session.apply_operation("correct_root_order", {"root_id": "root-b", "root_order": 5})
    parent_before = session.roots["root-a"].points.copy()
    child_before = session.roots["root-c"].points.copy()
    untouched = {key: session.roots[key].points.copy() for key in ("proximal", "co-located", "distal", "child-side", "nested", "root-b")}
    session.apply_operation("swap_junction_branches", SWAP)
    parent, child = session.roots["root-a"], session.roots["root-c"]
    np.testing.assert_array_equal(parent.points, np.vstack([parent_before[:2], child_before[1:]]))
    np.testing.assert_array_equal(child.points, parent_before[1:])
    expected = {
        "root-a": ("primary", 1, 1), "root-c": ("root-a", 2, 1),
        "proximal": ("root-a", 2, 0), "co-located": ("root-a", 2, 1),
        "distal": ("root-c", 3, 1), "child-side": ("root-a", 2, 2),
        "nested": ("child-side", 3, 1), "root-b": ("primary", 5, 3),
    }
    for root_id, (parent_id, order, index) in expected.items():
        root = session.roots[root_id]
        assert (root.parent_id, root.order, root.insertion_index) == (parent_id, order, index)
        np.testing.assert_array_equal(root.points[0], session.roots[parent_id].points[index])
        assert root.traits["root_order"] == order
        assert root.traits["parent_id"] == parent_id
    for root_id, points in untouched.items():
        np.testing.assert_array_equal(session.roots[root_id].points, points)
    assert session.roots["child-side"].order_overridden is False
    assert session.roots["root-b"].order_overridden is True
    # Parent basal points keep their identity; both outgoing arms exchange labels.
    np.testing.assert_array_equal(session.mesh.root_labels,
        [0]*5 + [1, 1, 3, 3] + [2]*4 + [1]*4 + [-1, -2])
    np.testing.assert_array_equal(session.mesh.assignment_states[-2:], [0, 2])
    assert set(parent.source_root_ids) == set(child.source_root_ids) == {"root-a", "root-c"}
    assert parent.traits["length"] == pytest.approx(np.linalg.norm(np.diff(parent.points, axis=0), axis=1).sum())
    assert _file_digests(branching_bundle) == before_files


def test_swap_preserves_graph_indices_at_a_geometric_self_contact(branching_bundle: Path) -> None:
    path = branching_bundle / "root_hierarchy.json"
    hierarchy = json.loads(path.read_text(encoding="utf-8"))
    roots = {root["root_id"]: root for root in hierarchy["roots"]}
    # The distal arm revisits the fork coordinate at a different graph node.
    roots["root-a"]["polyline"].append([0.5, 0, 3])
    roots["distal"].update(polyline=[[0.5, 0, 3], [0.5, -0.2, 3]],
                            insertion_point=[0.5, 0, 3], insertion_index=4)
    # Keep the new parent long enough for the longer returned child arm.
    roots["root-c"]["polyline"].append([0.5, 1.6, 2.8])
    path.write_text(json.dumps(hierarchy), encoding="utf-8")
    session = _new_session(branching_bundle)
    session.apply_operation("swap_junction_branches", SWAP)
    distal = session.roots["distal"]
    assert distal.parent_id == "root-c"
    assert distal.insertion_index == 3  # Not its co-located new node 0.


def test_swap_history_replay_and_exports(branching_bundle: Path, tmp_path: Path) -> None:
    session = _new_session(branching_bundle)
    before = _materialised_snapshot(session)
    session.apply_operation("swap_junction_branches", SWAP, operation_id="junction-correction")
    after = _materialised_snapshot(session)
    session.undo()
    assert _materialised_snapshot(session) == before
    session.redo()
    assert _materialised_snapshot(session) == after
    session.close()
    replay = EditorSession(branching_bundle, session_dir=session.session_dir)
    assert _materialised_snapshot(replay) == after
    export = replay.export_materialised(tmp_path / "junction-export")
    mesh = read_labeled_ply(export / "edited_segmented_root_structure.ply")
    np.testing.assert_array_equal(mesh.root_labels, replay.mesh.root_labels)
    np.testing.assert_array_equal(mesh.positions, replay.mesh.positions)
    np.testing.assert_array_equal(mesh.triangles, replay.mesh.triangles)
    orders = {root.numeric_label: root.order for root in replay.roots.values()}
    for label, order in orders.items():
        assert np.all(mesh.root_orders[mesh.root_labels == label] == order)
    rsml = ET.parse(export / "edited_root_system.rsml")
    base = "./scene/plant/root[@id='primary']/root[@id='root-a']"
    assert rsml.find(base + "/root[@id='root-c']/root[@id='distal']") is not None
    assert rsml.find(base + "/root[@id='child-side']/root[@id='nested']") is not None
    assert rsml.find(base + "/root[@id='root-c']/root[@id='child-side']") is None
    hierarchy = json.loads((export / "edited_root_hierarchy.json").read_text(encoding="utf-8"))
    for row in hierarchy["roots"]:
        root = replay.roots[row["root_id"]]
        assert row["parent_id"] == root.parent_id
        np.testing.assert_array_equal(row["polyline"], root.points)
    replay.undo()
    assert _materialised_snapshot(replay) == before


def test_primary_swap_preserves_base_and_moves_distal_children(editor_bundle: Path) -> None:
    path = editor_bundle / "root_hierarchy.json"
    hierarchy = json.loads(path.read_text(encoding="utf-8"))
    # Shorten this fixture's distal lateral to fit its corrected parent.
    row = next(root for root in hierarchy["roots"] if root["root_id"] == "root-b")
    row["polyline"] = row["polyline"][:2]
    path.write_text(json.dumps(hierarchy), encoding="utf-8")
    session = _new_session(editor_bundle)
    session.apply_operation("swap_junction_branches", {
        "parent_id": "primary", "child_id": "root-a", "insertion_index": 1,
    })
    primary = session.roots["primary"]
    assert primary.parent_id is None and primary.order == 0 and primary.numeric_label == 0
    np.testing.assert_array_equal(primary.points[0], [0, 0, 10])
    assert session.roots["root-b"].parent_id == "root-a"
    assert session.roots["root-b"].order == 2
    assert session.roots["root-c"].parent_id == "primary"
    assert session.roots["root-c"].order == 1


@pytest.mark.parametrize("arguments,match", [
    ({**SWAP, "child_id": "root-b"}, "direct child"),
    ({**SWAP, "insertion_index": 2}, "junction has changed"),
    ({"parent_id": "root-a", "child_id": "root-c"}, "junction has changed"),
    ({**SWAP, "parent_id": "missing"}, "Unknown root"),
    ({"parent_id": "primary", "child_id": "root-a", "insertion_index": 1}, "exceeds parent"),
])
def test_invalid_swaps_are_atomic(editor_bundle: Path, arguments: dict, match: str) -> None:
    session = _new_session(editor_bundle)
    before = _materialised_snapshot(session)
    with pytest.raises(EditorValidationError, match=match):
        session.apply_operation("swap_junction_branches", arguments)
    assert _materialised_snapshot(session) == before
    assert session.public_state()["operation_count"] == 0


def test_terminal_junction_is_visible_but_cannot_swap(editor_bundle: Path) -> None:
    path = editor_bundle / "root_hierarchy.json"
    hierarchy = json.loads(path.read_text(encoding="utf-8"))
    row = next(root for root in hierarchy["roots"] if root["root_id"] == "root-c")
    row["polyline"] = [[1.5, 0, 2.8], [1.5, 0.25, 2.8]]
    row["insertion_point"] = row["polyline"][0]
    row["insertion_index"] = 3
    path.write_text(json.dumps(hierarchy), encoding="utf-8")
    session = _new_session(editor_bundle)
    before = _materialised_snapshot(session)
    junction = next(j for j in session.public_state()["junctions"] if j["parent_id"] == "root-a")
    assert junction["can_swap"] is False
    with pytest.raises(EditorValidationError, match="terminal"):
        session.apply_operation("swap_junction_branches", {**SWAP, "insertion_index": 3})
    assert _materialised_snapshot(session) == before


def test_swap_log_failure_restores_labels_and_topology(editor_bundle: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    session = _new_session(editor_bundle)
    before = _materialised_snapshot(session)
    def fail_log(_event: dict) -> None:
        raise OSError("durable log failure")
    monkeypatch.setattr(session, "_append_log", fail_log)
    with pytest.raises(OSError, match="durable log failure"):
        session.apply_operation("swap_junction_branches", SWAP)
    assert _materialised_snapshot(session) == before
    assert session.public_state()["operation_count"] == 0


def test_read_only_view_can_inspect_but_not_swap(editor_bundle: Path) -> None:
    session = EditorSession(editor_bundle, session_dir=editor_bundle.parent / "readonly", read_only=True)
    assert len(session.public_state()["junctions"]) == 3
    with pytest.raises(EditorValidationError, match="read-only"):
        session.apply_operation("swap_junction_branches", SWAP)
