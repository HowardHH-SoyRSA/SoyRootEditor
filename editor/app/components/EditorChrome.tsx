"use client";

import type { FormEvent } from "react";
import type {
  EditorState,
  HoverInfo,
  LoadProgress,
  RootRecord,
  ToolMode,
} from "../types";
import {
  ROOT_EXPORT_COLORS,
  rgbToCss,
  rootOrderCssColor,
} from "../lib/rootColors";

export interface ToolDefinition {
  id: ToolMode;
  label: string;
  mark: string;
  shortcut: string;
  help: string;
}

export const TOOLS: ToolDefinition[] = [
  { id: "select", label: "Inspect", mark: "⌖", shortcut: "1", help: "Click a surface or hierarchy item to select, highlight, and frame its root." },
  { id: "create", label: "Create", mark: "+", shortcut: "0", help: "Select a parent root, then draw through two or more grey unassigned points." },
  { id: "split", label: "Split", mark: "⑂", shortcut: "2", help: "Click inside a root to split its centerline at the nearest path point." },
  { id: "merge", label: "Merge", mark: "⋈", shortcut: "3", help: "Select the root to keep, then click a locally connected root with compatible direction." },
  { id: "assign", label: "Assign", mark: "◉", shortcut: "4", help: "Select a target root, then Shift + left-drag to paint one continuous, undoable 3D brush region. Left-drag rotates." },
  { id: "reconnect", label: "Reconnect", mark: "⌁", shortcut: "5", help: "Select a detached root, then click its new connection point on another root." },
  { id: "reparent", label: "Reparent", mark: "↳", shortcut: "6", help: "Select a root, then click its attachment on the new parent; the base connects there." },
  { id: "delete", label: "Delete", mark: "⌫", shortcut: "7", help: "Click a non-primary root, then confirm its deletion." },
  { id: "redraw", label: "Redraw", mark: "✎", shortcut: "8", help: "Select a root, click two or more surface points, then apply the new path." },
  { id: "order", label: "Order", mark: "#", shortcut: "9", help: "Select a root and enter its corrected order in the inspector." },
];

export function ConnectionScreen({
  state,
  error,
  endpoint,
  onEndpointChange,
  onSubmit,
  onRetry,
}: {
  state: "starting" | "connecting" | "connected" | "error";
  error: string;
  endpoint: string;
  onEndpointChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onRetry: () => void;
}) {
  return (
    <main className="connection-screen">
      <div className="connection-glow" />
      <section className="connection-card">
        <div className="connection-brand">
          <div className="brand-mark large" aria-hidden="true"><span /><span /><span /></div>
          <p>SOYROOTBIO</p>
          <h1>Root structure, finally explorable.</h1>
          <span>
            A full-resolution 3D workspace for inspecting and correcting root
            graphs without changing the automatic result.
          </span>
        </div>
        {state === "connecting" || state === "starting" ? (
          <div className="connection-progress" role="status">
            <div className="spinner" />
            <strong>Opening the local editing session…</strong>
            <p>Reading root hierarchy, traits, and hardware capabilities.</p>
          </div>
        ) : (
          <form className="connection-form" onSubmit={onSubmit}>
            <span className="error-kicker">LOCAL API NOT REACHED</span>
            <h2>Connect to the editor server</h2>
            <p>{error}</p>
            <label>
              Server address
              <input
                type="url"
                value={endpoint}
                onChange={(event) => onEndpointChange(event.target.value)}
                placeholder="http://127.0.0.1:8765"
                autoFocus
              />
            </label>
            <div className="connection-actions">
              <button type="submit" className="button primary-button">Connect</button>
              <button type="button" className="button quiet-button" onClick={onRetry}>
                Retry same origin
              </button>
            </div>
            <small>When opened by SoyRootBio, this connects automatically.</small>
          </form>
        )}
      </section>
    </main>
  );
}

export function DatasetOpenScreen({
  recentDatasets,
  busy,
  error,
  onBrowse,
  onOpen,
  onNewWindow,
}: {
  recentDatasets: string[];
  busy: boolean;
  error: string;
  onBrowse: () => void;
  onOpen: (path: string) => void;
  onNewWindow: () => void;
}) {
  return (
    <main className="connection-screen">
      <div className="connection-glow" />
      <section className="connection-card dataset-open-card">
        <div className="connection-brand">
          <div className="brand-mark large" aria-hidden="true"><span /><span /><span /></div>
          <p>SOYROOTBIO</p>
          <h1>Choose a root dataset.</h1>
          <span>
            Open a completed output folder containing the labelled PLY,
            hierarchy, traits, and label map.
          </span>
        </div>
        <div className="dataset-open-actions">
          <button type="button" className="button primary-button" onClick={onBrowse} disabled={busy}>
            {busy ? "Opening folder chooser…" : "Browse output folder"}
          </button>
          <button type="button" className="button quiet-button" onClick={onNewWindow} disabled={busy}>
            Open another viewer window
          </button>
          {error ? <p className="dataset-error">{error}</p> : null}
          {recentDatasets.length ? (
            <div className="recent-datasets">
              <span>RECENT DATASETS</span>
              {recentDatasets.map((path) => (
                <button key={path} type="button" onClick={() => onOpen(path)} disabled={busy} title={path}>
                  <strong>{leafName(path)}</strong><small>{path}</small>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export function DatasetSelector({
  currentPath,
  recentDatasets,
  busy,
  onSelect,
  onBrowse,
  onNewWindow,
}: {
  currentPath: string;
  recentDatasets: string[];
  busy: boolean;
  onSelect: (path: string) => void;
  onBrowse: () => void;
  onNewWindow: () => void;
}) {
  const choices = recentDatasets.filter((path) => path !== currentPath);
  return (
    <div className="dataset-selector" title={currentPath}>
      <label>
        <span>DATASET</span>
        <select
          value={currentPath}
          disabled={busy}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "__browse__") onBrowse();
            else if (value !== currentPath) onSelect(value);
          }}
        >
          <option value={currentPath}>{leafName(currentPath)}</option>
          {choices.map((path) => (
            <option key={path} value={path}>{leafName(path)}</option>
          ))}
          <option value="__browse__">Browse for output folder…</option>
        </select>
      </label>
      <button type="button" onClick={onBrowse} disabled={busy} title="Browse for a completed SoyRootBio output folder">…</button>
      <button type="button" onClick={onNewWindow} disabled={busy} title="Open another independent viewer window">+□</button>
    </div>
  );
}

export function DatasetSwitchDialog({
  outputDir,
  draftCount,
  canFinish,
  onFinish,
  onDiscard,
  onCancel,
}: {
  outputDir: string;
  draftCount: number;
  canFinish: boolean;
  onFinish: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="confirm-dialog dataset-switch-dialog" role="dialog" aria-modal="true" aria-labelledby="switch-title" onMouseDown={(event) => event.stopPropagation()}>
        <span className="danger-icon">⇄</span>
        <p className="error-kicker">UNFINISHED PATH</p>
        <h2 id="switch-title">Switch to {leafName(outputDir)}?</h2>
        <p>
          The current {draftCount}-point path has not been added to the operation
          log. Finish it, discard it, or keep working in this dataset.
        </p>
        <div className="dialog-actions three-actions">
          <button type="button" className="quiet-button" onClick={onCancel}>Cancel</button>
          <button type="button" className="danger-button" onClick={onDiscard}>Discard and switch</button>
          <button type="button" className="primary-button" onClick={onFinish} disabled={!canFinish}>Finish and switch</button>
        </div>
      </section>
    </div>
  );
}

export function Toolbar({
  activeTool,
  state,
  busy,
  readOnly,
  onTool,
  onUndo,
  onRedo,
  onExport,
}: {
  activeTool: ToolMode;
  state: EditorState;
  busy: boolean;
  readOnly: boolean;
  onTool: (tool: ToolMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
}) {
  return (
    <nav className="tool-strip" aria-label="Root editing tools">
      <div className="history-tools">
        <button className="icon-action" type="button" disabled={busy || readOnly || !state.can_undo} onClick={onUndo} title="Undo (Ctrl Z)" aria-label="Undo last edit">↶</button>
        <button className="icon-action" type="button" disabled={busy || readOnly || !state.can_redo} onClick={onRedo} title="Redo (Ctrl Shift Z)" aria-label="Redo last edit">↷</button>
      </div>
      <div className="tool-divider" />
      <div className="edit-tools">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`tool-button ${activeTool === tool.id ? "active" : ""}`}
            type="button"
            disabled={busy || (readOnly && tool.id !== "select")}
            onClick={() => onTool(tool.id)}
            title={`${tool.help} Shortcut ${tool.shortcut}`}
            aria-pressed={activeTool === tool.id}
          >
            <span>{tool.mark}</span><b>{tool.label}</b><kbd>{tool.shortcut}</kbd>
          </button>
        ))}
      </div>
      <div className="tool-divider" />
      <button type="button" className="export-button" onClick={onExport} disabled={busy || readOnly}>
        <span>⇩</span> Export edits
      </button>
    </nav>
  );
}

export function PanelHeader({
  eyebrow,
  title,
  side,
  collapsed,
  onCollapse,
}: {
  eyebrow: string;
  title: string;
  side: "left" | "right";
  collapsed: boolean;
  onCollapse: () => void;
}) {
  return (
    <div className="panel-header">
      {!collapsed ? <div><span>{eyebrow}</span><strong title={title}>{title}</strong></div> : null}
      <button type="button" onClick={onCollapse} className="panel-toggle" aria-label={`${collapsed ? "Open" : "Close"} ${side} panel`}>
        {side === "left" ? (collapsed ? "›" : "‹") : collapsed ? "‹" : "›"}
      </button>
    </div>
  );
}

export function MeshLoading({ progress }: { progress: LoadProgress }) {
  return (
    <div className="mesh-loading" role="status">
      <div className="loading-orbit"><span /><span /><span /></div>
      <span className="loading-kicker">FULL-RESOLUTION PIPELINE</span>
      <strong>{progress.message}</strong>
      <div className="progress-track"><i style={{ width: `${Math.max(progress.progress * 100, 2)}%` }} /></div>
      <div className="loading-meta"><span>{progress.phase.toUpperCase()}</span><b>{Math.round(progress.progress * 100)}%</b></div>
      <p>No vertex downsampling is applied.</p>
    </div>
  );
}

export function DraftControls({
  mode,
  count,
  disabled,
  selectedRoot,
  onUndoPoint,
  onClear,
  onApply,
}: {
  mode: "redraw" | "create";
  count: number;
  disabled: boolean;
  selectedRoot: RootRecord | null;
  onUndoPoint: () => void;
  onClear: () => void;
  onApply: () => void;
}) {
  const creating = mode === "create";
  return (
    <div className="draft-controls">
      <div>
        <span>{creating ? "NEW ROOT PATH" : "REDRAW PATH"}</span>
        <strong>
          {selectedRoot
            ? creating
              ? `Parent: ${selectedRoot.root_id}`
              : selectedRoot.root_id
            : creating
              ? "Select a parent root first"
              : "Select a root first"}
        </strong>
        <small>
          {count} {creating ? "unassigned " : "draft "}
          {count === 1 ? "point" : "points"}
        </small>
      </div>
      <button type="button" onClick={onUndoPoint} disabled={!count || disabled}>Remove last</button>
      <button type="button" onClick={onClear} disabled={!count || disabled}>Clear</button>
      <button type="button" className="primary-button" onClick={onApply} disabled={count < 2 || !selectedRoot || disabled}>
        {creating ? "Create root" : "Apply path"}
      </button>
    </div>
  );
}

export function ConfirmDialog({
  root,
  onCancel,
  onConfirm,
}: {
  root: RootRecord;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" onMouseDown={(event) => event.stopPropagation()}>
        <span className="danger-icon">⌫</span>
        <p className="error-kicker">DELETE GRAPH ROOT</p>
        <h2 id="delete-title">Delete {root.root_id}?</h2>
        <p>
          Its {root.children_ids.length} direct {root.children_ids.length === 1 ? "child" : "children"} will be
          reattached to {root.parent_id ?? "the primary axis"}, and its mesh points will become unassigned.
        </p>
        <div className="preservation-note"><span>▣</span><p><strong>The automatic output remains intact.</strong>This deletion is appended to the session log and can be undone.</p></div>
        <div className="dialog-actions">
          <button type="button" className="quiet-button" onClick={onCancel}>Cancel</button>
          <button type="button" className="danger-button" onClick={onConfirm} autoFocus>Delete root</button>
        </div>
      </section>
    </div>
  );
}

export function HoverTooltip({
  hovered,
  root,
  activeTool,
}: {
  hovered: HoverInfo;
  root: RootRecord | null;
  activeTool: ToolMode;
}) {
  const left = typeof window === "undefined" ? hovered.clientX + 16 : Math.min(hovered.clientX + 16, window.innerWidth - 278);
  const top = typeof window === "undefined" ? hovered.clientY + 16 : Math.min(hovered.clientY + 16, window.innerHeight - 188);
  const isUncertain = hovered.numericLabel === -2;
  const unassignedColor = rgbToCss(
    isUncertain
      ? ROOT_EXPORT_COLORS.uncertain
      : ROOT_EXPORT_COLORS.unassigned,
  );
  const clickInstruction =
    activeTool === "create" && hovered.numericLabel === -1
      ? "add this point to the new root path"
      : root
        ? "inspect this root"
        : isUncertain
          ? "continue; uncertain points cannot seed a root"
          : "clear selection";
  return (
    <div className="hover-card" style={{ left, top }}>
      <div className="hover-title">
        <i style={{ background: root ? rootOrderCssColor(root.root_order) : unassignedColor }} />
        <strong>{root?.root_id ?? (isUncertain ? "Uncertain" : "Unassigned")}</strong>
        {root ? <span>O{root.root_order}</span> : null}
      </div>
      {root ? (
        <dl>
          <div><dt>Length</dt><dd>{formatMetric(root.length, 3)} {root.units.length}</dd></div>
          <div><dt>Mean diameter</dt><dd>{formatMetric(root.mean_diameter, 3)} {root.units.length}</dd></div>
          <div><dt>Tip–gravity</dt><dd>{formatMetric(root.tip_gravity_angle_deg, 2)}°</dd></div>
        </dl>
      ) : (
        <p>
          {isUncertain
            ? "This point is withheld because its root ownership is ambiguous."
            : "This grey surface point is available for root creation or assignment."}
        </p>
      )}
      <small>Click to {clickInstruction}.</small>
    </div>
  );
}

export function ToolGuidance({ tool }: { tool: ToolDefinition }) {
  return (
    <div className="tool-guidance" role="status">
      <span className="guidance-mark">{tool.mark}</span>
      <div><strong>{tool.label}</strong><p>{tool.help}</p></div>
      <kbd>{tool.shortcut}</kbd>
    </div>
  );
}

export function formatMetric(value: number | null, digits = 3): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  if (value !== 0 && (Math.abs(value) >= 10000 || Math.abs(value) < 0.001)) return value.toExponential(2);
  return value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

function leafName(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? path;
}
