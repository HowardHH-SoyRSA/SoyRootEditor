"use client";

import { create } from "zustand";
import type { EditorState, HoverInfo, JunctionHover, LoadProgress, ToolMode, Vec3 } from "./types";

interface EditorUiState {
  serverState: EditorState | null;
  selectedRootId: string | null;
  selectedPatchId: string | null;
  selectedJunctionId: string | null;
  hoveredJunction: JunctionHover | null;
  hovered: HoverInfo | null;
  tool: ToolMode;
  draftPoints: Vec3[];
  brushRadius: number;
  focusRequest: { rootId: string; nonce: number } | null;
  patchFocusRequest: { patchId: string; nonce: number } | null;
  loadProgress: LoadProgress;
  meshReady: boolean;
  clientGpu: string | null;
  setServerState: (state: EditorState) => void;
  replaceDataset: (state: EditorState | null) => void;
  setSelectedRootId: (rootId: string | null) => void;
  setSelectedPatchId: (patchId: string | null) => void;
  setHovered: (hovered: HoverInfo | null) => void;
  setSelectedJunctionId: (junctionId: string | null) => void;
  setHoveredJunction: (hovered: JunctionHover | null) => void;
  setTool: (tool: ToolMode) => void;
  addDraftPoint: (point: Vec3) => void;
  removeDraftPoint: () => void;
  clearDraft: () => void;
  setBrushRadius: (radius: number) => void;
  requestFocus: (rootId: string) => void;
  requestPatchFocus: (patchId: string) => void;
  setLoadProgress: (progress: LoadProgress) => void;
  setMeshReady: (ready: boolean) => void;
  setClientGpu: (gpu: string | null) => void;
}

export const useEditorStore = create<EditorUiState>((set) => ({
  serverState: null,
  selectedRootId: null,
  selectedPatchId: null,
  selectedJunctionId: null,
  hoveredJunction: null,
  hovered: null,
  tool: "select",
  draftPoints: [],
  brushRadius: 1,
  focusRequest: null,
  patchFocusRequest: null,
  loadProgress: { phase: "idle", progress: 0, message: "Waiting for dataset" },
  meshReady: false,
  clientGpu: null,
  setServerState: (serverState) =>
    set((current) => {
      const stillExists =
        current.selectedRootId &&
        serverState.roots.some((root) => root.root_id === current.selectedRootId);
      const samePatchRevision =
        current.serverState?.mesh.root_label_revision ===
        serverState.mesh.root_label_revision;
      const patchStillExists =
        samePatchRevision &&
        current.selectedPatchId &&
        serverState.point_patches.some(
          (patch) => patch.patch_id === current.selectedPatchId,
        );
      return {
        serverState,
        selectedRootId: stillExists ? current.selectedRootId : null,
        selectedPatchId: patchStillExists ? current.selectedPatchId : null,
        selectedJunctionId: serverState.junctions?.some(
          (junction) => junction.junction_id === current.selectedJunctionId,
        ) ? current.selectedJunctionId : null,
        hoveredJunction: null,
      };
    }),
  replaceDataset: (serverState) =>
    set({
      serverState,
      selectedRootId: null,
      selectedPatchId: null,
      selectedJunctionId: null,
      hoveredJunction: null,
      hovered: null,
      tool: "select",
      draftPoints: [],
      focusRequest: null,
      patchFocusRequest: null,
      loadProgress: {
        phase: "idle",
        progress: 0,
        message: serverState
          ? "Preparing the selected dataset"
          : "Waiting for dataset",
      },
      meshReady: false,
    }),
  setSelectedRootId: (selectedRootId) =>
    set({ selectedRootId, selectedPatchId: null, selectedJunctionId: null }),
  setSelectedPatchId: (selectedPatchId) => set({ selectedPatchId, selectedJunctionId: null }),
  setHovered: (hovered) => set({ hovered }),
  setSelectedJunctionId: (selectedJunctionId) => set((current) => ({
    selectedJunctionId,
    selectedPatchId: null,
    selectedRootId: current.serverState?.junctions?.find(
      (junction) => junction.junction_id === selectedJunctionId,
    )?.parent_id ?? current.selectedRootId,
  })),
  setHoveredJunction: (hoveredJunction) => set({ hoveredJunction }),
  setTool: (tool) =>
    set((current) => ({
      tool,
      selectedJunctionId: null,
      hoveredJunction: null,
      draftPoints:
        tool === current.tool && (tool === "redraw" || tool === "create")
          ? current.draftPoints
          : [],
    })),
  addDraftPoint: (point) =>
    set((current) => ({ draftPoints: [...current.draftPoints, point] })),
  removeDraftPoint: () =>
    set((current) => ({ draftPoints: current.draftPoints.slice(0, -1) })),
  clearDraft: () => set({ draftPoints: [] }),
  setBrushRadius: (brushRadius) => set({ brushRadius }),
  requestFocus: (rootId) =>
    set((current) => ({
      focusRequest: { rootId, nonce: (current.focusRequest?.nonce ?? 0) + 1 },
    })),
  requestPatchFocus: (patchId) =>
    set((current) => ({
      patchFocusRequest: {
        patchId,
        nonce: (current.patchFocusRequest?.nonce ?? 0) + 1,
      },
    })),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  setMeshReady: (meshReady) => set({ meshReady }),
  setClientGpu: (clientGpu) => set({ clientGpu }),
}));
