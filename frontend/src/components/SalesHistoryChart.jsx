import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { fmtUnits } from "../format";

function HistoryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-discount">Week {point.week}</div>
      <div className="chart-tooltip-profit">{fmtUnits(point.units)} units</div>
    </div>
  );
}

export default function SalesHistoryChart({ weeklyUnits }) {
  if (!weeklyUnits || weeklyUnits.length === 0) {
    return <div className="chart-placeholder">No sales history for this product.</div>;
  }

  const data = weeklyUnits.map((units, i) => ({ week: i + 1, units }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id="historyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="week"
          tickFormatter={(w) => `W${w}`}
          interval={7}
          tick={{ fontFamily: "var(--font-body)", fontSize: 11, fill: "var(--text-faint)" }}
          axisLine={{ stroke: "var(--border-strong)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmtUnits}
          tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--text-faint)" }}
          axisLine={false}
          tickLine={false}
          width={54}
        />
        <Tooltip content={<HistoryTooltip />} cursor={{ stroke: "var(--text-faint)", strokeDasharray: "3 3" }} />
        <Area
          type="monotone"
          dataKey="units"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#historyFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
