import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { CATEGORY_COLOR } from "../categoryIcon";
import { fmtCompact } from "../format";

const REGION_COLOR = "var(--accent)";

function BarTooltip({ active, payload, labelKey }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-discount">{point[labelKey]}</div>
      <div className="chart-tooltip-profit">{fmtCompact(point.annual_units)} units</div>
    </div>
  );
}

function MiniBarChart({ data, labelKey, colorFor }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <XAxis
          dataKey={labelKey}
          tick={{ fontFamily: "var(--font-body)", fontSize: 11, fill: "var(--text-faint)" }}
          axisLine={{ stroke: "var(--border-strong)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmtCompact}
          tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--text-faint)" }}
          axisLine={false}
          tickLine={false}
          width={38}
        />
        <Tooltip content={<BarTooltip labelKey={labelKey} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="annual_units" radius={[5, 5, 0, 0]} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={colorFor(d)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function CategoryRegionBars({ byCategory, byRegion }) {
  if (!byCategory || !byRegion) return null;

  return (
    <div className="breakdown-grid">
      <div>
        <div className="breakdown-title">By category</div>
        <MiniBarChart data={byCategory} labelKey="category" colorFor={(d) => CATEGORY_COLOR[d.category] ?? "var(--accent)"} />
      </div>
      <div>
        <div className="breakdown-title">By region</div>
        <MiniBarChart data={byRegion} labelKey="region" colorFor={() => REGION_COLOR} />
      </div>
    </div>
  );
}
