import { ROOT_EXPORT_COLORS, rgbToCss } from "../lib/rootColors";
import { useEditorStore } from "../store";
import type { DisplayCategory } from "../types";

const JUNCTION_COLOR = [102, 217, 255] as const;
const CENTERLINE_HIGHLIGHT_COLOR = "#FF3030";

const LEGEND_ITEMS = [
  { category: "primary", label: "Primary", order: "O0", color: ROOT_EXPORT_COLORS.primary },
  { category: "order1", label: "First order", order: "O1", color: ROOT_EXPORT_COLORS.order1 },
  { category: "order2", label: "Second order", order: "O2", color: ROOT_EXPORT_COLORS.order2 },
  { category: "order3", label: "Third order", order: "O3", color: ROOT_EXPORT_COLORS.order3 },
  { category: "higherOrder", label: "Higher order", order: "O4+", color: ROOT_EXPORT_COLORS.higherOrder },
  { category: "uncertain", label: "Uncertain", order: "QC", color: ROOT_EXPORT_COLORS.uncertain },
  { category: "unassigned", label: "Unassigned", order: "—", color: ROOT_EXPORT_COLORS.unassigned },
  { category: "junctions", label: "Junctions", order: "UI", color: JUNCTION_COLOR },
] satisfies ReadonlyArray<{
  category: DisplayCategory;
  label: string;
  order: string;
  color: readonly [number, number, number];
}>;

export function RootColorLegend({ collapsed }: { collapsed: boolean }) {
  const displayVisibility = useEditorStore((store) => store.displayVisibility);
  const toggleDisplayCategory = useEditorStore(
    (store) => store.toggleDisplayCategory,
  );
  const highlightCenterlinesRed = useEditorStore((store) => store.highlightCenterlinesRed);
  const toggleCenterlineHighlight = useEditorStore((store) => store.toggleCenterlineHighlight);
  return (
    <aside
      className={`root-color-legend ${collapsed ? "is-collapsed" : ""}`}
      aria-label="SoyRootBio exported color legend"
    >
      <header>
        <span>EXPORT COLORS</span>
        <small>PLY · CSV · UI</small>
      </header>
      <ul>
        {LEGEND_ITEMS.map((item) => {
          const color = rgbToCss(item.color);
          const visible = displayVisibility[item.category];
          const description = `${item.label} · ${item.order} · ${color.toUpperCase()} · ${visible ? "visible" : "hidden"}`;
          return (
            <li
              key={item.category}
              className={visible ? "is-visible" : "is-hidden"}
              aria-label={description}
            >
              <button
                type="button"
                className="legend-visibility-switch"
                role="switch"
                aria-checked={visible}
                aria-label={`${visible ? "Hide" : "Show"} ${item.label}`}
                title={`${visible ? "Hide" : "Show"} ${item.label}`}
                onClick={() => toggleDisplayCategory(item.category)}
              >
                <i aria-hidden="true" style={{ background: color }} />
              </button>
              <span>{item.label}<b>{item.order}</b></span>
              <code>{color.toUpperCase()}</code>
            </li>
          );
        })}
        <li className={`centerline-highlight-control ${highlightCenterlinesRed ? "is-visible" : "is-hidden"}`}>
          <button
            type="button"
            className="legend-visibility-switch"
            role="switch"
            aria-checked={highlightCenterlinesRed}
            aria-label="Highlight centerlines in red"
            title="Highlight centerlines in red"
            onClick={toggleCenterlineHighlight}
          >
            <i aria-hidden="true" style={{ background: CENTERLINE_HIGHLIGHT_COLOR }} />
          </button>
          <span>Red centerlines<b>UI</b></span>
          <code>{CENTERLINE_HIGHLIGHT_COLOR}</code>
        </li>
      </ul>
      {!collapsed ? <p className="junction-legend">Switches control the viewport only; exported labels and colors are unchanged.</p> : null}
    </aside>
  );
}
