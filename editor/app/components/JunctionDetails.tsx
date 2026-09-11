"use client";

import { useState } from "react";
import type { JunctionHover, JunctionRecord } from "../types";

export function JunctionDetails({ junction, disabled, onSwap, onClose }: {
  junction: JunctionRecord;
  disabled: boolean;
  onSwap: (childId: string) => void;
  onClose: () => void;
}) {
  const [choice, setChoice] = useState(junction.child_ids[0] ?? "");
  const childId = junction.child_ids.includes(choice) ? choice : junction.child_ids[0];
  return (
    <div className="details-scroll junction-details">
      <section className="identity-block">
        <span className="section-label">JUNCTION · NODE {junction.insertion_index}</span>
        <h2>{junction.parent_id}</h2>
        <p>Source position: {junction.position.map((value) => value.toPrecision(5)).join(", ")}</p>
        <button type="button" className="small-apply" onClick={onClose}>Back to root measurements</button>
      </section>
      <section className="metric-section">
        <span className="section-label">SWITCH OUTGOING BRANCH IDENTITIES</span>
        <label className="junction-choice">
          Child arm to become the parent continuation
          <select value={childId} onChange={(event) => setChoice(event.target.value)} disabled={disabled}>
            {junction.child_ids.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        </label>
        <p>The upstream path and ID <strong>{junction.parent_id}</strong> stay in place. Its path will continue along the current <strong>{childId}</strong> arm.</p>
        <p>The old parent continuation becomes <strong>{childId}</strong>, attached at this junction. Downstream roots follow their original arms; their parent links, orders, point labels and measurements are corrected together.</p>
        <p>Manual order overrides in the affected child subtrees are reset. Your camera view stays unchanged. This is one undoable, logged edit.</p>
        {!junction.can_swap ? <p role="status">{junction.disabled_reason}</p> : null}
        <button type="button" className="small-apply" disabled={disabled || !junction.can_swap || !childId} onClick={() => onSwap(childId)}>
          Switch parent / child arms
        </button>
        <p className="connection-rule">Invalid topology or length constraints reject the entire edit without changing the session.</p>
      </section>
    </div>
  );
}

export function JunctionTooltip({ junction, hovered }: { junction: JunctionRecord; hovered: JunctionHover }) {
  return (
    <div className="hover-card junction-tooltip" role="tooltip" style={{
      left: Math.max(8, Math.min(hovered.clientX + 18, window.innerWidth - 300)),
      top: Math.max(8, Math.min(hovered.clientY + 18, window.innerHeight - 180)),
    }}>
      <strong>Junction · {junction.parent_id}</strong>
      <p>Child arms: {junction.child_ids.join(", ")}</p>
      <p>Node {junction.insertion_index} · {junction.position.map((v) => v.toPrecision(4)).join(", ")}</p>
      <small>Click to inspect or switch outgoing branch identities.</small>
    </div>
  );
}
