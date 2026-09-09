from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import threading
from uuid import uuid4

from .session import EditorSession, EditorValidationError


@dataclass
class ViewerSlot:
    viewer_id: str
    session: EditorSession | None = None
    read_only_reason: str | None = None
    switching: bool = False


class ViewerManager:
    """Own independent dataset sessions for every browser viewer window."""

    def __init__(
        self,
        output_dir: str | Path | None = None,
        *,
        session_dir: str | Path | None = None,
    ) -> None:
        if output_dir is None and session_dir is not None:
            raise ValueError("--session-dir requires an initial --output directory.")
        self._lock = threading.RLock()
        self._viewers: dict[str, ViewerSlot] = {}
        self._writers: dict[Path, str] = {}
        self._recent_datasets: list[str] = []
        self._session_overrides: dict[Path, Path] = {}
        self._initial_claimed = False

        viewer_id = self._new_viewer_id()
        initial_session: EditorSession | None = None
        if output_dir is not None:
            resolved_output = Path(output_dir).resolve()
            resolved_session = (
                Path(session_dir).resolve()
                if session_dir is not None
                else resolved_output / ".soyrootbio-editor"
            )
            self._session_overrides[resolved_output] = resolved_session
            initial_session = EditorSession(
                resolved_output,
                session_dir=resolved_session,
            )
            self._writers[resolved_session] = viewer_id
            self._remember(resolved_output)
        self._viewers[viewer_id] = ViewerSlot(viewer_id, initial_session)
        self.default_viewer_id = viewer_id

    @staticmethod
    def _new_viewer_id() -> str:
        return uuid4().hex

    def create_or_resume_viewer(
        self,
        requested_id: str | None = None,
        *,
        new_window: bool = False,
    ) -> dict:
        with self._lock:
            if requested_id and requested_id in self._viewers and not new_window:
                return self.viewer_payload(requested_id)
            if not new_window and not self._initial_claimed:
                self._initial_claimed = True
                return self.viewer_payload(self.default_viewer_id)
            viewer_id = self._new_viewer_id()
            self._viewers[viewer_id] = ViewerSlot(viewer_id)
            return self.viewer_payload(viewer_id)

    def viewer_payload(self, viewer_id: str) -> dict:
        with self._lock:
            slot = self._require_slot(viewer_id)
            return {
                "viewer_id": slot.viewer_id,
                "state": self._public_state(slot),
                "recent_datasets": list(self._recent_datasets),
            }

    def session_for(self, viewer_id: str | None) -> EditorSession:
        with self._lock:
            slot = self._require_slot(viewer_id or self.default_viewer_id)
            if slot.session is None:
                raise EditorValidationError(
                    "No dataset is open in this viewer window. Choose a SoyRootBio output folder."
                )
            return slot.session

    def switch_dataset(self, viewer_id: str, output_dir: str | Path) -> dict:
        resolved_output = Path(output_dir).expanduser().resolve()
        if not resolved_output.is_dir():
            raise EditorValidationError(
                f"Dataset folder does not exist: {resolved_output}"
            )

        reserved_writer = False
        with self._lock:
            slot = self._require_slot(viewer_id)
            if slot.switching:
                raise EditorValidationError(
                    "This viewer window is already switching datasets."
                )
            if (
                slot.session is not None
                and slot.session.output_dir == resolved_output
                and not slot.session.read_only
            ):
                return self.viewer_payload(viewer_id)
            slot.switching = True
            resolved_session = self._session_overrides.get(
                resolved_output,
                resolved_output / ".soyrootbio-editor",
            )
            owner = self._writers.get(resolved_session)
            read_only = owner is not None and owner != viewer_id
            if not read_only:
                self._writers[resolved_session] = viewer_id
                reserved_writer = True

        candidate: EditorSession | None = None
        try:
            candidate = EditorSession(
                resolved_output,
                session_dir=resolved_session,
                read_only=read_only,
            )
            old_session = slot.session
            if old_session is not None:
                old_session.close()
        except Exception:
            if candidate is not None:
                candidate.close()
            with self._lock:
                slot.switching = False
                if reserved_writer and self._writers.get(resolved_session) == viewer_id:
                    old_key = slot.session.session_dir if slot.session else None
                    if old_key != resolved_session:
                        self._writers.pop(resolved_session, None)
            raise

        with self._lock:
            old_session = slot.session
            if (
                old_session is not None
                and not old_session.read_only
                and old_session.session_dir != resolved_session
                and self._writers.get(old_session.session_dir) == viewer_id
            ):
                self._writers.pop(old_session.session_dir, None)
            slot.session = candidate
            slot.read_only_reason = (
                "This dataset is open for editing in another viewer window. "
                "This window is a read-only snapshot."
                if read_only
                else None
            )
            slot.switching = False
            self._session_overrides.setdefault(resolved_output, resolved_session)
            self._remember(resolved_output)
            return self.viewer_payload(viewer_id)

    def close_all(self) -> None:
        with self._lock:
            sessions = [
                slot.session for slot in self._viewers.values() if slot.session
            ]
            self._writers.clear()
        for session in sessions:
            session.close()

    def _public_state(self, slot: ViewerSlot) -> dict | None:
        if slot.session is None:
            return None
        state = slot.session.public_state()
        state["viewer_id"] = slot.viewer_id
        state["read_only_reason"] = slot.read_only_reason
        state["mesh"]["url"] = self._viewer_url(
            state["mesh"]["url"], slot.viewer_id
        )
        state["mesh"]["labels_url"] = self._viewer_url(
            state["mesh"]["labels_url"], slot.viewer_id
        )
        for patch in state["point_patches"]:
            patch["indices_url"] = self._viewer_url(
                patch["indices_url"], slot.viewer_id
            )
        return state

    @staticmethod
    def _viewer_url(url: str, viewer_id: str) -> str:
        separator = "&" if "?" in url else "?"
        return f"{url}{separator}viewer={viewer_id}"

    def _require_slot(self, viewer_id: str) -> ViewerSlot:
        try:
            return self._viewers[viewer_id]
        except KeyError as exc:
            raise EditorValidationError(
                "This viewer window has expired. Refresh it to start a new window."
            ) from exc

    def _remember(self, output_dir: Path) -> None:
        value = str(output_dir)
        self._recent_datasets = [
            item for item in self._recent_datasets if item != value
        ]
        self._recent_datasets.insert(0, value)
        del self._recent_datasets[12:]
