import { useMemo, useState } from "react";
import { fmtMoney, fmtPct } from "../format";

function buildGrid(points) {
  const discounts = [...new Set(points.map((p) => p.discount))].sort((a, b) => a - b);
  const horizons = [...new Set(points.map((p) => p.horizon_weeks))].sort((a, b) => a - b);
  const lookup = new Map(points.map((p) => [`${p.discount}|${p.horizon_weeks}`, p.incremental_profit]));
  const maxAbs = Math.max(1, ...points.map((p) => Math.abs(p.incremental_profit)));
  return { discounts, horizons, lookup, maxAbs };
}

function cellColor(value, maxAbs) {
  if (value === undefined) return "var(--bg-elevated-2)";
  const ratio = Math.max(-1, Math.min(1, value / maxAbs));
  if (ratio >= 0) return `rgba(0, 230, 118, ${0.12 + 0.7 * ratio})`;
  return `rgba(255, 82, 82, ${0.12 + 0.7 * -ratio})`;
}

export default function ProfitHeatmap({ points, best }) {
  const [hover, setHover] = useState(null);
  const { discounts, horizons, lookup, maxAbs } = useMemo(() => buildGrid(points ?? []), [points]);

  if (!points || points.length === 0) {
    return <div className="chart-placeholder">Building the profit grid…</div>;
  }

  const bestDiscount = best
    ? discounts.reduce((closest, d) => (Math.abs(d - best.discount) < Math.abs(closest - best.discount) ? d : closest), discounts[0])
    : null;

  return (
    <div className="heatmap">
      <div className="heatmap-body">
        <div className="heatmap-rows">
          {horizons.map((h) => (
            <div className="heatmap-row-label" key={h}>
              {h}
            </div>
          ))}
        </div>
        <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${discounts.length}, 1fr)` }}>
          {horizons.map((h) =>
            discounts.map((d) => {
              const value = lookup.get(`${d}|${h}`);
              const isBest = d === bestDiscount && h === 4;
              return (
                <div
                  key={`${d}-${h}`}
                  className={"heatmap-cell" + (isBest ? " heatmap-cell-best" : "")}
                  style={{ background: cellColor(value, maxAbs) }}
                  onMouseEnter={() => setHover({ d, h, value })}
                  onMouseLeave={() => setHover(null)}
                />
              );
            })
          )}
        </div>
      </div>
      <div className="heatmap-x-axis" style={{ gridTemplateColumns: `repeat(${discounts.length}, 1fr)` }}>
        {discounts.map((d, i) => (
          <div className="heatmap-x-label" key={d}>
            {i % 3 === 0 ? fmtPct(d) : ""}
          </div>
        ))}
      </div>
      <div className="heatmap-caption">
        <span>discount % (columns) &times; promo length in weeks (rows)</span>
        {hover && (
          <span className="heatmap-readout">
            {fmtPct(hover.d)} off, {hover.h}wk &rarr; {hover.value !== undefined ? fmtMoney(hover.value) : "n/a"}
          </span>
        )}
      </div>
    </div>
  );
}
